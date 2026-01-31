import { VideoOptions } from "../types";

interface OptionsPanelProps {
    options: VideoOptions;
    setOptions: (options: VideoOptions) => void;
    disabled: boolean;
    duration: number; // Video duration in seconds
}

export default function OptionsPanel({ options, setOptions, disabled, duration }: OptionsPanelProps) {
    const handleChange = (key: keyof VideoOptions, value: any) => {
        setOptions({ ...options, [key]: value });
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`space-y-4 p-4 rounded-xl border border-white/5 bg-zinc-900/50 backdrop-blur-sm transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Format Selection */}
            <div className="space-y-1">
                <label className="text-xs uppercase text-zinc-500 font-bold tracking-wider">Output Format</label>
                <select
                    value={options.format}
                    onChange={(e) => handleChange('format', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-brand-yellow/50 transition-colors"
                >
                    <option value="mp4">MP4 (H.264)</option>
                    <option value="mkv">MKV</option>
                    <option value="avi">AVI</option>
                    <option value="mov">MOV</option>
                    <option value="webm">WEBM</option>
                    <option value="gif">GIF</option>
                </select>
            </div>

            {/* Resolution */}
            <div className="space-y-1">
                <label className="text-xs uppercase text-zinc-500 font-bold tracking-wider">Resolution</label>
                <select
                    value={options.resolution}
                    onChange={(e) => handleChange('resolution', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-brand-yellow/50 transition-colors"
                >
                    <option value="original">Original</option>
                    <option value="1080p">1080p</option>
                    <option value="720p">720p</option>
                    <option value="480p">480p</option>
                </select>
            </div>

            {/* Trim / Clip */}
            <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex justify-between items-center">
                    <label className="text-xs uppercase text-zinc-500 font-bold tracking-wider">Trim / Clip</label>
                    <span className="text-[10px] text-zinc-600 font-mono">
                        Max: {formatTime(duration)}
                    </span>
                </div>
                <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                        <label className="text-[10px] text-zinc-400">Start (s)</label>
                        <input
                            type="number"
                            min="0"
                            max={duration.toString()}
                            step="0.1"
                            value={options.trimStart}
                            onChange={(e) => {
                                const val = Math.max(0, Math.min(parseFloat(e.target.value) || 0, duration));
                                handleChange('trimStart', val);
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white font-mono focus:outline-none focus:border-brand-yellow/50"
                        />
                        <div className="text-[10px] text-zinc-600 text-right">{formatTime(options.trimStart)}</div>
                    </div>
                    <div className="flex-1 space-y-1">
                        <label className="text-[10px] text-zinc-400">End (s)</label>
                        <input
                            type="number"
                            min="0"
                            max={duration.toString()}
                            step="0.1"
                            placeholder="End"
                            value={options.trimEnd ?? ''}
                            onChange={(e) => {
                                const val = e.target.value === '' ? null : Math.max(0, Math.min(parseFloat(e.target.value), duration));
                                handleChange('trimEnd', val);
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white font-mono focus:outline-none focus:border-brand-yellow/50"
                        />
                        <div className="text-[10px] text-zinc-600 text-right">
                            {options.trimEnd ? formatTime(options.trimEnd) : 'End of File'}
                        </div>
                    </div>
                </div>
            </div>

            {/* GIF Options */}
            {options.format === 'gif' && (
                <div className="space-y-1 pt-2 border-t border-white/5">
                    <label className="text-xs uppercase text-zinc-500 font-bold tracking-wider">GIF Quality</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => handleChange('gifMode', 'basic')}
                            className={`p-2 rounded-lg text-xs font-medium border transition-all ${options.gifMode === 'basic'
                                    ? 'bg-brand-orange/20 border-brand-orange text-brand-orange'
                                    : 'bg-black/40 border-white/10 text-zinc-400 hover:bg-white/5'
                                }`}
                        >
                            Basic
                        </button>
                        <button
                            onClick={() => handleChange('gifMode', 'pro')}
                            className={`p-2 rounded-lg text-xs font-medium border transition-all ${options.gifMode === 'pro'
                                    ? 'bg-brand-orange/20 border-brand-orange text-brand-orange'
                                    : 'bg-black/40 border-white/10 text-zinc-400 hover:bg-white/5'
                                }`}
                        >
                            <span className="flex items-center justify-center gap-1">
                                Pro <span className="text-[9px] bg-brand-yellow text-black px-1 rounded font-bold">HQ</span>
                            </span>
                        </button>
                    </div>
                    <p className="text-[10px] text-zinc-500 pt-1">
                        {options.gifMode === 'pro'
                            ? 'Uses 2-pass palette generation for better colors (Slower)'
                            : 'Standard conversion (Faster)'}
                    </p>
                </div>
            )}

            {/* Quality (CRF) - Hide for GIF */}
            {options.format !== 'gif' && (
                <div className="space-y-1 pt-2 border-t border-white/5">
                    <div className="flex justify-between">
                        <label className="text-xs uppercase text-zinc-500 font-bold tracking-wider">Quality (CRF)</label>
                        <span className="text-xs text-brand-yellow font-mono">{options.quality}</span>
                    </div>
                    <input
                        type="range"
                        min="18"
                        max="51"
                        step="1"
                        value={options.quality}
                        onChange={(e) => handleChange('quality', parseInt(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-white/20"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-600">
                        <span>High Quality</span>
                        <span>Low Size</span>
                    </div>
                </div>
            )}

            {/* Speed */}
            <div className="space-y-1">
                <div className="flex justify-between">
                    <label className="text-xs uppercase text-zinc-500 font-bold tracking-wider">Speed</label>
                    <span className="text-xs text-brand-yellow font-mono">{options.speed}x</span>
                </div>
                <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={options.speed}
                    onChange={(e) => handleChange('speed', parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-white/20"
                />
            </div>

            {/* Audio Toggle */}
            <div className="flex items-center gap-3 pt-2">
                <input
                    type="checkbox"
                    checked={options.removeAudio}
                    onChange={(e) => handleChange('removeAudio', e.target.checked)}
                    id="removeAudio"
                    className="w-4 h-4 rounded bg-black/40 border-white/10 text-brand-yellow focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="removeAudio" className="text-sm text-zinc-300 cursor-pointer select-none">Remove Audio Track</label>
            </div>
        </div>
    );
}
