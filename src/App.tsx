import { useState, useRef } from "react";
import { Command } from "@tauri-apps/plugin-shell";
import { save } from "@tauri-apps/plugin-dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { RefreshCw, Zap, Minus, X } from "lucide-react";
import FileDrop from "./components/FileDrop";
import OptionsPanel from "./components/OptionsPanel";
import LogViewer from "./components/LogViewer";
import ProgressBar from "./components/ProgressBar";
import { VideoOptions, DEFAULT_OPTIONS } from "./types";

function App() {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [options, setOptions] = useState<VideoOptions>(DEFAULT_OPTIONS);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'converting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);

  // For duration parsing to calculate progress
  const durationRef = useRef<number>(0);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg]);

    // Simple duration parsing: "Duration: 00:00:20.50"
    if (msg.includes("Duration:")) {
      const match = msg.match(/Duration:\s(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      if (match) {
        const hours = parseFloat(match[1]);
        const minutes = parseFloat(match[2]);
        const seconds = parseFloat(match[3]);
        durationRef.current = hours * 3600 + minutes * 60 + seconds;
        addLog(`Duration detected: ${durationRef.current.toFixed(2)}s`);
      }
    }

    // Simple time parsing: "time=00:00:10.20"
    if (msg.includes("time=") && durationRef.current > 0) {
      const match = msg.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      if (match) {
        const hours = parseFloat(match[1]);
        const minutes = parseFloat(match[2]);
        const seconds = parseFloat(match[3]);
        const currentTime = hours * 3600 + minutes * 60 + seconds;
        setProgress((currentTime / durationRef.current) * 100);
      }
    }
  };

  const handleConvert = async () => {
    if (!filePath || status === 'converting') return;

    try {
      // 1. Select Output
      const outputExt = options.format;
      const savePath = await save({
        filters: [{
          name: 'Video',
          extensions: [outputExt]
        }],
        defaultPath: fileName ? fileName.replace(/\.[^/.]+$/, `_converted.${outputExt}`) : `output.${outputExt}`
      });

      if (!savePath) return;

      setStatus('converting');
      setLogs([]);
      setProgress(0);
      durationRef.current = 0;
      addLog(`Starting conversion: ${filePath} -> ${savePath}`);

      // 2. Build Args
      const args = [
        '-i', filePath,      // Input
      ];

      // Resolution
      if (options.resolution !== 'original') {
        const height = options.resolution.replace('p', '');
        args.push('-vf', `scale=-2:${height}`);
      }

      // Speed (video only first, audio complex later if needed)
      // Simple speed using setpts for video. For audio, atempo.
      // ffmpeg -i input.mp4 -filter_complex "[0:v]setpts=0.5*PTS[v];[0:a]atempo=2.0[a]" -map "[v]" -map "[a]" output.mp4
      if (options.speed !== 1.0) {
        const setpts = (1 / options.speed).toFixed(2);
        // Handling audio tempo is tricky (needs chaining for > 2.0 or < 0.5)
        // For MVP let's assume range 0.5 - 2.0 covers standard atempo usage
        args.push('-filter_complex', `[0:v]setpts=${setpts}*PTS[v];[0:a]atempo=${options.speed}[a]`, '-map', '[v]', '-map', '[a]');
      }

      // Audio
      if (options.removeAudio) {
        args.push('-an');
      }

      // Quality (CRF) - lower is better quality
      if (options.format !== 'gif') {
        args.push('-crf', options.quality.toString());
      }

      // Output file always last
      args.push('-y', savePath); // -y to overwrite if dialog didn't handle it (plugin usually handles confirmation)

      addLog(`Command: ffmpeg ${args.join(' ')}`);

      // 3. Execution
      const command = Command.sidecar('bin/ffmpeg', args);

      command.on('close', (data) => {
        addLog(`Process finished with code ${data.code}`);
        if (data.code === 0) {
          setStatus('completed');
          setProgress(100);
        } else {
          setStatus('error');
        }
      });

      command.on('error', (error) => {
        addLog(`Error: ${error}`);
        setStatus('error');
      });

      command.stdout.on('data', line => addLog(line));
      command.stderr.on('data', line => addLog(line)); // FFmpeg sends stats to stderr

      await command.spawn();

    } catch (e) {
      console.error(e);
      addLog(`Exception: ${e}`);
      setStatus('error');
    }
  };

  const reset = () => {
    setFilePath(null);
    setFileName(null);
    setLogs([]);
    setStatus('idle');
    setProgress(0);
  };

  const minimizeWindow = () => getCurrentWindow().minimize();
  const closeWindow = () => getCurrentWindow().close();

  return (
    <div className="flex flex-col h-screen bg-pro-950 text-white selection:bg-brand-orange/30 overflow-hidden border border-pro-800 rounded-lg">

      {/* Title Bar & Drag Region */}
      <div data-tauri-drag-region className="h-10 bg-pro-900 border-b border-pro-800 flex items-center justify-between px-4 select-none">
        <div className="flex items-center gap-2 pointer-events-none">
          <span className="font-bold text-sm tracking-tight text-white/80">
            Kenichi<span className="text-brand-orange">Converter</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={minimizeWindow} className="p-1.5 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white transition-colors">
            <Minus size={14} />
          </button>
          <button onClick={closeWindow} className="p-1.5 hover:bg-red-500/20 hover:text-red-500 rounded-md text-zinc-400 transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Control Panel */}
        <div className="w-80 border-r border-pro-800 bg-pro-950/50 flex flex-col">
          <div className="p-4 flex-1 overflow-y-auto space-y-6">
            {!filePath ? (
              <FileDrop onFileSelect={(path, name) => {
                setFilePath(path);
                setFileName(name);
              }} />
            ) : (
              <div className="bg-pro-900 rounded-xl p-4 border border-pro-800 relative group">
                <button
                  onClick={reset}
                  className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-white bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove File"
                >
                  <RefreshCw size={14} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-orange/10 text-brand-orange rounded-lg flex items-center justify-center shrink-0 border border-brand-orange/20">
                    <Zap size={20} />
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-medium text-sm truncate text-zinc-200" title={fileName || ''}>{fileName}</div>
                    <div className="text-xs text-zinc-500 font-mono truncate">{filePath}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="relative">
              <OptionsPanel
                options={options}
                setOptions={setOptions}
                disabled={status === 'converting'}
              />
            </div>
          </div>

          <div className="p-4 border-t border-pro-800 bg-pro-900/30">
            <button
              onClick={handleConvert}
              disabled={!filePath || status === 'converting'}
              className="w-full py-3 bg-white text-zinc-950 font-bold rounded-xl hover:bg-brand-yellow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:bg-white disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-black/20"
            >
              {status === 'converting' ? (
                <>
                  <RefreshCw className="animate-spin" size={18} /> Converting...
                </>
              ) : (
                <>
                  <Zap size={18} fill="currentColor" /> Start Process
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Area: Logs & Visualization */}
        <div className="flex-1 flex flex-col p-4 gap-4 h-full bg-pro-950">
          <div className="flex-1 bg-pro-900/50 rounded-2xl border border-pro-800 p-1 overflow-hidden flex flex-col shadow-inner">
            <LogViewer logs={logs} />
          </div>

          {/* Status Bar */}
          <div className="h-16 bg-pro-900/50 rounded-xl border border-pro-800 flex items-center px-6 shadow-sm">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1">
                <span>Status</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <ProgressBar progress={progress} status={status} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
