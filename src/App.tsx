import { useState, useRef, useEffect } from "react";
import { readFile } from "@tauri-apps/plugin-fs";
import { Command } from "@tauri-apps/plugin-shell";
import { save } from "@tauri-apps/plugin-dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { RefreshCw, Zap, Minus, X } from "lucide-react";
import FileDrop from "./components/FileDrop";
import OptionsPanel from "./components/OptionsPanel";
import LogViewer from "./components/LogViewer";
import ProgressBar from "./components/ProgressBar";
import { VideoOptions, DEFAULT_OPTIONS } from "./types";

function App() {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [options, setOptions] = useState<VideoOptions>(DEFAULT_OPTIONS);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'converting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0); // Video duration in seconds

  // For duration parsing to calculate progress (fallback if metadata fails)
  const durationRef = useRef<number>(0);

  // Prevent default behavior to allow dropping globally (fixes "not allowed" cursor)
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('dragover', preventDefault, { capture: true });
    document.addEventListener('drop', preventDefault, { capture: true });
    return () => {
      document.removeEventListener('dragover', preventDefault, { capture: true });
      document.removeEventListener('drop', preventDefault, { capture: true });
    };
  }, []);

  const getMetadata = async (path: string) => {
    try {
      const command = Command.sidecar('bin/ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        path
      ]);
      const output = await command.execute();
      if (output.code === 0) {
        const d = parseFloat(output.stdout);
        setDuration(d);
        durationRef.current = d; // Sync ref
      }
    } catch (e) {
      console.error('Error getting metadata:', e);
    }
  };

  const generateThumbnail = async (path: string) => {
    try {
      const cacheDir = await invoke<string>('get_app_cache_dir');
      const sep = navigator.userAgent.includes('Windows') ? '\\' : '/';
      const outputPath = `${cacheDir}${sep}thumbnail.jpg`;

      const args = [
        '-y',               // Overwrite
        '-ss', '00:00:01',  // Seek to 1s
        '-i', path,         // Input
        '-vframes', '1',    // Single frame
        '-q:v', '2',        // Quality
        outputPath
      ];

      const command = Command.sidecar('bin/ffmpeg', args);
      const result = await command.execute();

      if (result.code === 0) {
        const fileBytes = await readFile(outputPath);
        const base64String = btoa(
          new Uint8Array(fileBytes)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        const dataUrl = `data:image/jpeg;base64,${base64String}`;
        setThumbnail(dataUrl);
      } else {
        console.error('Thumbnail generation failed:', result.stderr);
      }
    } catch (e) {
      console.error('Error generating thumbnail:', e);
    }
  };

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

      addLog(`Starting conversion: ${filePath} -> ${savePath}`);

      // 2. Build Args
      const args = [];

      // Trimming (Start)
      if (options.trimStart > 0) {
        args.push('-ss', options.trimStart.toString());
      }

      // Input
      args.push('-i', filePath);

      // Trimming (Duration)
      if (options.trimEnd !== null && options.trimEnd > options.trimStart) {
        const clipDuration = options.trimEnd - options.trimStart;
        args.push('-t', clipDuration.toString());
      }

      // RE-THINKING FILTER CONSTRUCTION FOR ROBUSTNESS
      // Let's restart the filter block construction completely to handle Audio+Video safely.

      const filterChains = [];
      let vLabel = '0:v';
      let aLabel = '0:a';

      // -- VIDEO FILTERS --
      let vFilters = [];

      if (options.speed !== 1.0) {
        const setpts = (1 / options.speed).toFixed(2);
        vFilters.push(`setpts=${setpts}*PTS`);
      }

      if (options.resolution !== 'original') {
        const height = options.resolution.replace('p', '');
        vFilters.push(`scale=-2:${height}:flags=lanczos`);
      }

      // Construct Linear Video Chain
      if (vFilters.length > 0) {
        // [0:v] filter1,filter2 [v_processed]
        filterChains.push(`[${vLabel}]${vFilters.join(',')} [v_processed]`);
        vLabel = 'v_processed';
      }

      // -- GIF PRO MODE (Branching) --
      if (options.format === 'gif' && options.gifMode === 'pro') {
        // [v_processed] split [a][b]; [a] palettegen [p]; [b][p] paletteuse [v_final]
        // Note: vLabel acts as input
        filterChains.push(`[${vLabel}]split[a][b]`);
        filterChains.push(`[a]palettegen[p]`);
        filterChains.push(`[b][p]paletteuse[v_final]`);
        vLabel = 'v_final';
      }

      // -- AUDIO FILTERS --
      if (!options.removeAudio && options.format !== 'gif') {
        if (options.speed !== 1.0) {
          filterChains.push(`[${aLabel}]atempo=${options.speed}[a_processed]`);
          aLabel = 'a_processed';
        }
      }

      // Assemble Arguments
      if (filterChains.length > 0) {
        args.push('-filter_complex', filterChains.join(';'));
      }

      args.push('-map', `[${vLabel}]`);

      if (!options.removeAudio && options.format !== 'gif') {
        // If we processed audio, map the label. If not, map original 0:a?
        // If options.speed == 1.0, aLabel is still '0:a'.
        // mapping '0:a' works.
        args.push('-map', options.speed !== 1.0 ? `[${aLabel}]` : '0:a');
      }

      // Quality (CRF) - Only for non-GIF
      if (options.format !== 'gif') {
        args.push('-crf', options.quality.toString());
      }

      // Output file always last
      args.push('-y', savePath);

      addLog(`Command: ffmpeg ${args.join(' ')}`);

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
      command.stderr.on('data', line => addLog(line));

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
    setThumbnail(null);
    setDuration(0);
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
                generateThumbnail(path);
                getMetadata(path);
              }} />
            ) : (
              <div className="bg-pro-900 rounded-xl p-4 border border-pro-800 relative group">
                <button
                  onClick={reset}
                  className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-white bg-black/50 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove File"
                >
                  <RefreshCw size={14} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-10 bg-pro-950/50 rounded-lg flex items-center justify-center shrink-0 border border-pro-800 overflow-hidden">
                    {thumbnail ? (
                      <img src={thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-brand-orange/10 text-brand-orange flex items-center justify-center">
                        <Zap size={20} />
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden flex-1">
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
                duration={duration}
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
