import { Zap, RefreshCw } from 'lucide-react';
import { VideoOptions } from '../types';

interface MediaInfoCardProps {
    filePath: string;
    thumbnail: string | null;
    duration: number;
    options: VideoOptions;
    onOpenDialog: () => void;
    formatTime: (s: number) => string;
}

export function MediaInfoCard({
    filePath,
    thumbnail,
    duration,
    options,
    onOpenDialog,
    formatTime
}: MediaInfoCardProps) {
    const fileName = filePath.split(/[\\/]/).pop();
    const outputDuration = options.trimEnd ? options.trimEnd - options.trimStart : duration;
    const sourceExt = filePath.split('.').pop();

    return (
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
                        <img src={thumbnail} className="w-full h-full object-cover" alt="Video Thumbnail" />
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
                        {fileName}
                    </h3>
                    <div className="text-xs text-zinc-400 truncate mt-1 font-mono opacity-70">
                        {filePath}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                        <div className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-zinc-300">
                            {outputDuration.toFixed(1)}s Output
                        </div>
                        <div className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-zinc-300 uppercase">
                            {sourceExt} Source
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={onOpenDialog}
                            className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <span className="bg-brand-orange/20 text-brand-orange p-0.5 rounded">
                                <RefreshCw size={10} />
                            </span>
                            Use Different File
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
