import { useState, useCallback } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { Zap } from 'lucide-react';

// Components
import { TitleBar } from './components/TitleBar';
import { LandingPage } from './components/LandingPage';
import { MediaInfoCard } from './components/MediaInfoCard';
import { ActivityTerminal } from './components/ActivityTerminal';
import { ActionCenter } from './components/ActionCenter';
import { OptionsPanel } from './components/OptionsPanel';

// Hooks
import { useConverter } from './hooks/useConverter';
import { useFileProcessing } from './hooks/useFileProcessing';
import { useDragDrop } from './hooks/useDragDrop';

// Types
import { VideoOptions, DEFAULT_OPTIONS } from './types';

export default function App() {
  const [options, setOptions] = useState<VideoOptions>(DEFAULT_OPTIONS);

  // --- Hooks ---

  // Converter hook handles FFmpeg process and logs
  const { status, progress, logs, setLogs, convert, isConverting } = useConverter();

  // File processing hook handles metadata, thumbnails, and file selection
  const {
    filePath,
    thumbnail,
    duration,
    handleFileSelect,
    openFileDialog
  } = useFileProcessing(setOptions, (msg) => setLogs(prev => [...prev, msg].slice(-100)));

  // Drag and drop hook handles Tauri events
  const { isDragging } = useDragDrop(handleFileSelect);

  // --- Handlers ---

  const handleChange = useCallback((key: keyof VideoOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const onConvert = async () => {
    if (!filePath || isConverting) return;

    try {
      // Pick save location
      const outputExt = options.format;
      let defaultName = filePath.split(/[\\/]/).pop() || 'output';
      defaultName = defaultName.replace(/\.[^/.]+$/, `_converted.${outputExt}`);

      const savePath = await save({
        filters: [{ name: 'Media', extensions: [outputExt] }],
        defaultPath: defaultName
      });

      if (savePath) {
        await convert(filePath, savePath, options, duration);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (isNaN(h)) return '00:00:00';
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Render ---

  return (
    <div className="h-screen w-screen flex flex-col text-white selection:bg-brand-yellow/30 font-sans overflow-hidden relative">

      {/* Background Layers */}
      <div className="absolute inset-0 -z-20 bg-zinc-950/90" />
      <div className="absolute inset-0 -z-20 backdrop-blur-3xl" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,var(--tw-gradient-stops))] from-indigo-500/15 via-zinc-950/0 to-zinc-950/0 pointer-events-none" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_right,var(--tw-gradient-stops))] from-brand-yellow/10 via-zinc-950/0 to-zinc-950/0 pointer-events-none" />

      <div className="absolute inset-0 -z-10 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
      />

      <TitleBar />

      <div className="flex-1 flex overflow-hidden p-6 gap-6 relative z-0">

        {/* Drag Overlay */}
        <div className={`absolute inset-0 z-10 transition-all duration-300 pointer-events-none ${isDragging ? 'bg-brand-yellow/10 backdrop-blur-sm' : ''}`}>
          {isDragging && (
            <div className="absolute inset-4 border-2 border-dashed border-brand-yellow/50 rounded-2xl flex items-center justify-center">
              <div className="bg-black/80 backdrop-blur-xl p-6 rounded-2xl border border-brand-yellow/20 shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95">
                <Zap size={32} className="text-brand-yellow" />
                <h3 className="text-xl font-bold text-white">Drop to Load</h3>
              </div>
            </div>
          )}
        </div>

        {!filePath ? (
          <LandingPage onOpenDialog={openFileDialog} />
        ) : (
          <>
            {/* Left Column: Output Preview & Monitoring */}
            <div className="flex-1 flex flex-col gap-4 min-w-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <MediaInfoCard
                filePath={filePath}
                thumbnail={thumbnail}
                duration={duration}
                options={options}
                onOpenDialog={openFileDialog}
                formatTime={formatTime}
              />

              <ActivityTerminal logs={logs} onClear={() => setLogs([])}>
                <ActionCenter
                  status={status}
                  progress={progress}
                  isConverting={isConverting}
                  onConvert={onConvert}
                />
              </ActivityTerminal>
            </div>

            {/* Right Column: Configuration */}
            <div className="flex-1 min-w-[320px] flex flex-col gap-4 animate-in fade-in slide-in-from-right-8 duration-500 delay-100">
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
