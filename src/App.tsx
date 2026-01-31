import { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { Command } from '@tauri-apps/plugin-shell';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Zap, RefreshCw, Minus, X, Square } from 'lucide-react';
import { OptionsPanel } from './components/OptionsPanel';
import { VideoOptions, DEFAULT_OPTIONS } from './types';

function App() {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle'); // idle, converting, success, error
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [options, setOptions] = useState<VideoOptions>(DEFAULT_OPTIONS);
  const [duration, setDuration] = useState(0); // Duration in seconds
  const [isDragging, setIsDragging] = useState(false);

  const durationRef = useRef(0);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Drag & Drop Handlers
  useEffect(() => {
    let unlisteners: (() => void)[] = [];

    async function setupDragDrop() {
      // Listen for drag enter
      const unlistenEnter = await listen('tauri://drag-enter', () => {
        setIsDragging(true);
      });

      // Listen for drag leave
      const unlistenLeave = await listen('tauri://drag-leave', () => {
        setIsDragging(false);
      });

      // Listen for drop
      const unlistenDrop = await listen<{ paths: string[] }>('tauri://drag-drop', (event) => {
        setIsDragging(false);
        if (event.payload.paths && event.payload.paths.length > 0) {
          handleFileSelect(event.payload.paths[0]);
        }
      });

      unlisteners.push(unlistenEnter, unlistenLeave, unlistenDrop);
    }

    setupDragDrop();

    return () => {
      unlisteners.forEach(unlisten => unlisten());
    };
  }, []);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, msg].slice(-100)); // Keep last 100 logs
  };

  const parseProgress = (msg: string) => {
    // Simple time parsing: "time=00:00:10.20"
    if (msg.includes("time=") && durationRef.current > 0) {
      const match = msg.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      if (match) {
        const hours = parseFloat(match[1]);
        const minutes = parseFloat(match[2]);
        const seconds = parseFloat(match[3]);
        const currentTime = hours * 3600 + minutes * 60 + seconds;
        const p = Math.min(100, (currentTime / durationRef.current) * 100);
        setProgress(Math.round(p));
      }
    }
  };

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
        durationRef.current = d;
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

  const handleFileSelect = (path: string) => {
    setFilePath(path);
    setThumbnail(null);
    setDuration(0);
    durationRef.current = 0;
    setOptions(DEFAULT_OPTIONS); // Reset options on new file
    setLogs([]);
    setProgress(0);
    setStatus('idle');

    generateThumbnail(path);
    getMetadata(path);
    addLog(`Loaded file: ${path}`);
  };

  const openFileDialog = async () => {
    try {
      const file = await open({
        multiple: false,
        filters: [{
          name: 'Media',
          extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'mp3', 'wav', 'flac', 'm4a']
        }]
      });
      if (file) {
        handleFileSelect(file as string);
      }
    } catch (err) {
      console.error("Failed to open file dialog", err);
    }
  };

  const handleConvert = async () => {
    if (!filePath || status === 'converting') return;

    try {
      const outputExt = options.format;
      let defaultName = filePath.split(/[\\/]/).pop() || 'output';
      defaultName = defaultName.replace(/\.[^/.]+$/, `_converted.${outputExt}`);

      const savePath = await save({
        filters: [{
          name: 'Video',
          extensions: [outputExt]
        }],
        defaultPath: defaultName
      });

      if (!savePath) return;

      setStatus('converting');
      setLogs([]);
      setProgress(0);
      addLog(`Starting conversion: ${filePath} -> ${savePath}`);

      // Build Args
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

      // -- FILTER CONSTRUCTION --
      const filterChains: string[] = [];
      let vLabel = '0:v';
      let aLabel = '0:a';
      const vFilters: string[] = [];

      // Video Filters
      if (options.speed !== 1.0) {
        const setpts = (1 / options.speed).toFixed(2);
        vFilters.push(`setpts=${setpts}*PTS`);
      }
      if (options.resolution !== 'original') {
        const height = options.resolution.replace('p', '');
        vFilters.push(`scale=-2:${height}:flags=lanczos`);
      }
      if (vFilters.length > 0) {
        filterChains.push(`[${vLabel}]${vFilters.join(',')}[v_processed]`);
        vLabel = 'v_processed';
      }

      // GIF Pro Mode
      if (options.format === 'gif' && options.gifMode === 'pro') {
        filterChains.push(`[${vLabel}]split[a][b]`);
        filterChains.push(`[a]palettegen[p]`);
        filterChains.push(`[b][p]paletteuse[v_final]`);
        vLabel = 'v_final';
      }

      // Audio Filters (Speed)
      const isAudio = ['mp3', 'wav', 'flac', 'm4a'].includes(options.format);
      if (!options.removeAudio && options.format !== 'gif') {
        if (options.speed !== 1.0) {
          filterChains.push(`[${aLabel}]atempo=${options.speed}[a_processed]`);
          aLabel = 'a_processed';
        }
      }

      // Assemble Filter Complex
      if (filterChains.length > 0) {
        args.push('-filter_complex', filterChains.join(';'));
      }

      const formatMapLabel = (label: string) => {
        return label.includes(':') ? label : `[${label}]`;
      };

      // Mappings
      if (isAudio) {
        args.push('-vn');
        const audioTarget = options.speed !== 1.0 ? aLabel : '0:a';
        args.push('-map', formatMapLabel(audioTarget));

        if (['mp3', 'm4a'].includes(options.format)) {
          args.push('-b:a', `${options.audioBitrate}k`);
        }
      } else {
        // Video Map
        args.push('-map', formatMapLabel(vLabel));

        // Audio Map
        if (!options.removeAudio && options.format !== 'gif') {
          const audioTarget = options.speed !== 1.0 ? aLabel : '0:a';
          args.push('-map', formatMapLabel(audioTarget));
        }
      }

      // Video Quality Control
      if (!isAudio && options.format !== 'gif') {
        if (options.compressionMode === 'target') {
          // Calculate Bitrate
          let calcDuration = durationRef.current;
          if (options.trimEnd !== null && options.trimEnd > options.trimStart) {
            calcDuration = options.trimEnd - options.trimStart;
          }

          if (calcDuration > 0 && options.targetSize > 0) {
            const targetBits = options.targetSize * 8 * 1024 * 1024;
            const totalBitrate = Math.floor(targetBits / calcDuration);

            const audioBitrate = 128000;
            let videoBitrate = totalBitrate;
            if (!options.removeAudio) videoBitrate -= audioBitrate;
            if (videoBitrate < 100000) videoBitrate = 100000;

            addLog(`Target: ${options.targetSize}MB, Calc Bitrate: ${(videoBitrate / 1000).toFixed(0)}k`);
            args.push('-b:v', videoBitrate.toString());
            args.push('-maxrate', videoBitrate.toString());
            args.push('-bufsize', (videoBitrate * 2).toString());
            if (!options.removeAudio) args.push('-b:a', '128k');
          } else {
            args.push('-crf', '23');
          }
        } else {
          args.push('-crf', options.quality.toString());
        }
      }

      args.push('-y', savePath);

      addLog(`Command: ffmpeg ${args.join(' ')}`);

      const command = Command.sidecar('bin/ffmpeg', args);

      command.stdout.on('data', (line) => {
        addLog(line);
        parseProgress(line);
      });

      command.stderr.on('data', (line) => {
        addLog(line);
        parseProgress(line);
      });

      const output = await command.execute();

      if (output.code === 0) {
        setStatus('idle');
        setProgress(100);
        addLog('Conversion Successful! 🎉');
      } else {
        setStatus('error');
        addLog(`Error: Process finished with code ${output.code}`);
      }
    } catch (e) {
      console.error(e);
      setStatus('error');
      addLog(`Exception: ${e}`);
    }
  };

  const handleChange = (key: keyof VideoOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (isNaN(h)) return '00:00:00';
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isConverting = status === 'converting';

  const minimizeWindow = () => getCurrentWindow().minimize();
  const toggleMaximize = () => getCurrentWindow().toggleMaximize();
  const closeWindow = () => getCurrentWindow().close();

  // -- RENDER --
  return (
    <div className="h-screen w-screen flex flex-col text-white selection:bg-brand-yellow/30 font-sans overflow-hidden relative">

      {/* 1. Base Dark Layer (High Opacity for Legibility) */}
      <div className="absolute inset-0 -z-20 bg-zinc-950/90" />

      {/* 2. Backdrop Blur (Frosted Glass Effect) */}
      <div className="absolute inset-0 -z-20 backdrop-blur-3xl" />

      {/* 3. Ambient Gradients (Wallpaper feel) */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,var(--tw-gradient-stops))] from-indigo-500/15 via-zinc-950/0 to-zinc-950/0 pointer-events-none" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_right,var(--tw-gradient-stops))] from-brand-yellow/10 via-zinc-950/0 to-zinc-950/0 pointer-events-none" />

      {/* 4. Subtle Noise / Texture (Optional but adds polish) */}
      <div className="absolute inset-0 -z-10 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
      />

      {/* Title / Drag Region */}
      <div
        data-tauri-drag-region
        className="h-10 flex items-center justify-between px-4 bg-transparent border-b border-white/5 shrink-0 z-50"
      >
        <div className="flex items-center gap-2 pointer-events-none opacity-80">
          <Zap size={14} className="text-brand-yellow" />
          <span className="text-xs font-bold tracking-widest uppercase">Kenichi Converter</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={minimizeWindow} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-zinc-400 hover:text-white">
            <Minus size={14} />
          </button>
          <button onClick={toggleMaximize} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-zinc-400 hover:text-white">
            <Square size={12} />
          </button>
          <button onClick={closeWindow} className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-colors text-zinc-400">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6 relative z-0">

        {/* File Drop Overlay */}
        <div className={`absolute inset-0 z-10 transition-all duration-300 pointer-events-none ${isDragging ? 'bg-brand-yellow/10 backdrop-blur-sm' : ''}`}>
          {isDragging && (
            <div className="absolute inset-4 border-2 border-dashed border-brand-yellow/50 rounded-2xl flex items-center justify-center">
              <div className="bg-black/80 backdrop-blur-xl p-6 rounded-2xl border border-brand-yellow/20 shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95">
                <div className="p-4 bg-brand-yellow/10 rounded-full text-brand-yellow">
                  <Zap size={32} />
                </div>
                <h3 className="text-xl font-bold text-white">Drop to Load</h3>
              </div>
            </div>
          )}
        </div>

        {!filePath ? (
          // EMPTY STATE: Full Screen Drop Zone
          <div className="flex-1 flex items-center justify-center">
            <div
              onClick={openFileDialog}
              className="group relative cursor-pointer"
            >
              <div className="absolute -inset-1 bg-linear-to-r from-brand-yellow to-brand-orange rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative glass-panel rounded-2xl p-12 text-center flex flex-col items-center gap-6 max-w-md w-full hover:scale-[1.02] transition-transform duration-300">
                <div className="w-20 h-20 bg-black/40 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner group-hover:border-brand-yellow/30 transition-colors">
                  <Zap size={40} className="text-zinc-500 group-hover:text-brand-yellow transition-colors duration-300" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-zinc-400">
                    Import Media
                  </h2>
                  <p className="text-zinc-500 mt-2 text-sm leading-relaxed">
                    Drag and drop video or audio files here,<br />or click to browse system.
                  </p>
                </div>
                <div className="flex gap-3 text-[10px] text-zinc-600 uppercase tracking-wider font-bold">
                  <span className="px-2 py-1 bg-white/5 rounded">MP4</span>
                  <span className="px-2 py-1 bg-white/5 rounded">MOV</span>
                  <span className="px-2 py-1 bg-white/5 rounded">MKV</span>
                  <span className="px-2 py-1 bg-white/5 rounded">MP3</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // DASHBOARD STATE
          <>
            {/* Left Column: Preview & Terminal */}
            <div className="flex-[2] flex flex-col gap-4 min-w-0 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* Media Preview Card */}
              <div className="glass-panel p-1 rounded-2xl flex gap-6 relative overflow-hidden group shrink-0">
                {/* Background Blur Image */}
                {thumbnail && (
                  <div
                    className="absolute inset-0 opacity-20 blur-3xl scale-125 pointer-events-none transition-opacity duration-700"
                    style={{ backgroundImage: `url(${thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                  />
                )}

                <div className="relative w-full p-5 flex gap-6 z-0">
                  {/* Thumbnail */}
                  <div className="w-48 aspect-video bg-black/50 rounded-lg border border-white/10 shadow-lg overflow-hidden shrink-0 relative">
                    {thumbnail ? (
                      <img src={thumbnail} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <Zap size={24} />
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-[10px] font-mono border border-white/10">
                      {formatTime(duration)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <h3 className="text-xl font-bold truncate text-white" title={filePath}>
                      {filePath.split(/[\\/]/).pop()}
                    </h3>
                    <div className="text-xs text-zinc-400 truncate mt-1 font-mono opacity-70">
                      {filePath}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <div className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-zinc-300">
                        {(options.trimEnd ? options.trimEnd - options.trimStart : duration).toFixed(1)}s Output
                      </div>
                      <div className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-zinc-300 uppercase">
                        {filePath.split('.').pop()} Source
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={openFileDialog}
                        className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <span className="bg-brand-orange/20 text-brand-orange p-0.5 rounded"><RefreshCw size={10} /></span> Use Different File
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terminal / Logs */}
              <div className="flex-1 glass-panel rounded-2xl flex flex-col min-h-0 overflow-hidden relative">
                <div className="px-4 py-2 border-b border-white/5 bg-black/20 flex justify-between items-center shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    Activity Log
                  </span>
                  <button onClick={() => setLogs([])} className="text-[10px] text-zinc-600 hover:text-white transition-colors">Clear</button>
                </div>
                <div
                  ref={consoleEndRef}
                  className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[11px]"
                >
                  {logs.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-700 gap-2">
                      <div className="p-2 border border-dashed border-zinc-800 rounded">
                        Waiting for commands...
                      </div>
                    </div>
                  )}
                  {logs.map((log, i) => (
                    <div key={i} className="break-all border-l-2 border-transparent hover:border-white/10 pl-2 py-0.5">
                      <span className="text-zinc-600 select-none mr-2">
                        [{new Date().toLocaleTimeString().split(' ')[0]}]
                      </span>
                      <span className={
                        log.toLowerCase().includes('error') ? 'text-red-400' :
                          log.toLowerCase().includes('success') ? 'text-emerald-400' :
                            log.includes('Command:') ? 'text-brand-yellow/70' :
                              'text-zinc-300'
                      }>
                        {log}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Footer (Moved here) */}
                <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md shrink-0">
                  <div className="mb-4">
                    {/* Status Bar inside footer for visibility */}
                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider mb-1.5">
                      <span className={status === 'error' ? 'text-red-400' : isConverting ? 'text-brand-yellow' : 'text-zinc-500'}>
                        {status === 'idle' ? 'Ready' : status === 'converting' ? 'Processing...' : status}
                      </span>
                      <span className="text-zinc-500">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ease-out ${status === 'error' ? 'bg-red-500' : 'bg-brand-yellow'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleConvert}
                    disabled={isConverting}
                    className={`
                                    w-full py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all duration-300
                                    flex items-center justify-center gap-2 group relative overflow-hidden
                                    ${isConverting
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-white text-black hover:scale-[1.02] active:scale-[0.98] hover:shadow-brand-yellow/20'
                      }
                                `}
                  >
                    {isConverting ? (
                      <>
                        <RefreshCw className="animate-spin" size={18} />
                        <span>Converting...</span>
                      </>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                        <Zap size={18} className={isConverting ? '' : 'text-brand-orange'} />
                        <span>Start Process</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column: Settings */}
            <div className="flex-1 min-w-[320px] max-w-[600px] flex flex-col gap-4 animate-in fade-in slide-in-from-right-8 duration-500 delay-100">
              <div className="glass-panel rounded-2xl flex-1 flex flex-col overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 bg-black/20">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Configuration</h2>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                  <OptionsPanel
                    options={options}
                    onChange={handleChange}
                    disabled={isConverting}
                    duration={duration}
                  />
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default App;
