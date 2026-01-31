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

    const isAudio = ['mp3', 'wav', 'flac', 'm4a'].includes(options.format);
    const isLossless = ['wav', 'flac'].includes(options.format);

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
                    <optgroup label="Video">
                        <option value="mp4">MP4 (H.264)</option>
                        <option value="mkv">MKV</option>
                        <option value="avi">AVI</option>
                        <option value="mov">MOV</option>
                        <option value="webm">WEBM</option>
                        <option value="gif">GIF</option>
                    </optgroup>
                    <optgroup label="Audio">
                        <option value="mp3">MP3</option>
                        <option value="m4a">M4A (AAC)</option>
                        <option value="wav">WAV (Lossless)</option>
                        <option value="flac">FLAC (Lossless)</option>
                    </optgroup>
                </select>
            </div>

            {/* Resolution (Video Only) */}
            {!isAudio && (
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
            )}

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

            {/* Audio Settings (Audio Only) */}
            {isAudio && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                    <label className="text-xs uppercase text-zinc-500 font-bold tracking-wider">Audio Quality</label>
                    {isLossless ? (
                        <div className="p-2 bg-brand-yellow/10 border border-brand-yellow/20 rounded-lg text-xs text-brand-yellow flex items-center justify-center gap-2">
                            <span className="font-bold">Lossless Quality</span>
                        </div>
                    ) : (
                        <select
                            value={options.audioBitrate}
                            onChange={(e) => handleChange('audioBitrate', parseInt(e.target.value))}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-brand-yellow/50 transition-colors"
                        >
                            <option value="320">320 kbps (High)</option>
                            <option value="256">256 kbps</option>
                            <option value="192">192 kbps (Standard)</option>
                            <option value="128">128 kbps (Low)</option>
                        </select>
                    )}
                </div>
            )}

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

            {/* Compression Options (Video Only, Non-GIF) */}
            {!isAudio && options.format !== 'gif' && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                    <label className="text-xs uppercase text-zinc-500 font-bold tracking-wider">Compression</label>

                    {/* Mode Toggle */}
                    <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                        <button
                            onClick={() => handleChange('compressionMode', 'quality')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${options.compressionMode === 'quality'
                                ? 'bg-zinc-700 text-white shadow-sm'
                                : 'text-zinc-400 hover:text-white'
                                }`}
                        >
                            Constant Quality
                        </button>
                        <button
                            onClick={() => handleChange('compressionMode', 'target')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${options.compressionMode === 'target'
                                ? 'bg-zinc-700 text-white shadow-sm'
                                : 'text-zinc-400 hover:text-white'
                                }`}
                        >
                            Target Size
                        </button>
                    </div>

                    {/* Constant Quality Mode */}
                    {options.compressionMode === 'quality' && (
                        <div className="space-y-1 pt-1">
                            <div className="flex justify-between">
                                <span className="text-xs text-zinc-400">CRF Value</span>
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

                    {/* Target Size Mode */}
                    {options.compressionMode === 'target' && (
                        <div className="space-y-3 pt-1">
                            {/* Presets */}
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { label: 'Discord', size: 25 },
                                    { label: 'WhatsApp', size: 16 },
                                    { label: 'Email', size: 10 }
                                ].map((preset) => (
                                    <button
                                        key={preset.label}
                                        onClick={() => handleChange('targetSize', preset.size)}
                                        className={`p-2 rounded-lg border text-xs transition-all ${options.targetSize === preset.size
                                            ? 'bg-brand-orange/20 border-brand-orange text-brand-orange'
                                            : 'bg-black/20 border-white/10 text-zinc-400 hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="font-bold">{preset.label}</div>
                                        <div className="text-[10px] opacity-70">{preset.size}MB</div>
                                    </button>
                                ))}
                            </div>

                            {/* Manual Input */}
                            <div className="flex items-center gap-2">
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] text-zinc-400">Max Size (MB)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={options.targetSize}
                                        onChange={(e) => handleChange('targetSize', parseFloat(e.target.value) || 1)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white font-mono focus:outline-none focus:border-brand-yellow/50"
                                    />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] text-zinc-400">Est. Bitrate</label>
                                    <div className="w-full bg-black/20 border border-white/5 rounded-lg p-2 text-sm text-zinc-500 font-mono text-right">
                                        {duration > 0 ? (
                                            `${Math.round(((options.targetSize * 8192) / (options.trimEnd ? options.trimEnd - options.trimStart : duration)))} kbps`
                                        ) : (
                                            <span className="text-xs italic">Unknown Dur.</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {duration === 0 && (
                                <p className="text-[10px] text-red-400 bg-red-500/10 p-2 rounded">
                                    ⚠️ Video duration unknown. Bitrate calculation may fail.
                                </p>
                            )}
                        </div>
                    )}
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
