import { VideoOptions } from "../types";

interface OptionsPanelProps {
    options: VideoOptions;
    setOptions: (options: VideoOptions) => void;
    disabled: boolean;
}

export default function OptionsPanel({ options, setOptions, disabled }: OptionsPanelProps) {
    const handleChange = (key: keyof VideoOptions, value: any) => {
        setOptions({ ...options, [key]: value });
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

            {/* Quality (CRF) */}
            <div className="space-y-1">
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
