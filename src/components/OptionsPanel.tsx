import { VideoOptions } from "../types";
import {
    FileVideo,
    Monitor,
    Scissors,
    Layers,
    Gauge,
    Music,
    Settings2,
    VolumeX,
    Image as ImageIcon,
    Zap
} from 'lucide-react';

interface OptionsPanelProps {
    options: VideoOptions;
    onChange: (key: keyof VideoOptions, value: any) => void;
    disabled: boolean;
    duration: number; // Video duration in seconds
}

export function OptionsPanel({ options, onChange, disabled, duration }: OptionsPanelProps) {
    const handleChange = (key: keyof VideoOptions, value: any) => {
        onChange(key, value);
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
        <div className={`space-y-8 p-1 transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>

            {/* SECTION: FORMAT */}
            <Section title="Output Format" icon={<FileVideo size={14} />}>
                <div className="relative group">
                    <select
                        value={options.format}
                        onChange={(e) => handleChange('format', e.target.value)}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-yellow/50 transition-all appearance-none cursor-pointer"
                    >
                        <optgroup label="Video" className="bg-zinc-950 text-white">
                            <option value="mp4" className="bg-zinc-950 text-white">MP4 (H.264)</option>
                            <option value="mkv" className="bg-zinc-950 text-white">MKV</option>
                            <option value="avi" className="bg-zinc-950 text-white">AVI</option>
                            <option value="mov" className="bg-zinc-950 text-white">MOV</option>
                            <option value="webm" className="bg-zinc-950 text-white">WEBM</option>
                            <option value="gif" className="bg-zinc-950 text-white">GIF</option>
                        </optgroup>
                        <optgroup label="Audio" className="bg-zinc-950 text-white">
                            <option value="mp3" className="bg-zinc-950 text-white">MP3</option>
                            <option value="m4a" className="bg-zinc-950 text-white">M4A (AAC)</option>
                            <option value="wav" className="bg-zinc-950 text-white">WAV (Lossless)</option>
                            <option value="flac" className="bg-zinc-950 text-white">FLAC (Lossless)</option>
                        </optgroup>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 group-hover:text-white transition-colors">
                        <Settings2 size={14} />
                    </div>
                </div>
            </Section>

            {/* SECTION: RESOLUTION (Video Only) */}
            {!isAudio && (
                <Section title="Resolution" icon={<Monitor size={14} />}>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2">
                        {['original', '1080p', '720p', '480p'].map((res) => (
                            <button
                                key={res}
                                onClick={() => handleChange('resolution', res)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${options.resolution === res
                                    ? 'bg-brand-yellow text-black border-brand-yellow shadow-[0_0_15px_-3px_rgba(234,179,8,0.3)]'
                                    : 'bg-white/5 border-transparent text-zinc-400 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {res === 'original' ? 'Original' : res}
                            </button>
                        ))}
                    </div>
                </Section>
            )}

            {/* SECTION: TRIM */}
            <Section title="Trim / Clip" icon={<Scissors size={14} />}
                rightElement={<span className="text-[10px] font-mono text-zinc-600">Max: {formatTime(duration)}</span>}
            >
                <div className="flex gap-4">
                    <TimeInput
                        label="Start"
                        value={options.trimStart}
                        max={duration}
                        onChange={(v) => handleChange('trimStart', v)}
                        formatTime={formatTime}
                    />
                    <TimeInput
                        label="End"
                        value={options.trimEnd}
                        max={duration}
                        onChange={(v) => handleChange('trimEnd', v)}
                        formatTime={formatTime}
                        isEnd
                    />
                </div>
            </Section>

            {/* SECTION: AUDIO SETTINGS */}
            {isAudio && (
                <Section title="Audio Settings" icon={<Music size={14} />}>
                    {isLossless ? (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-3">
                            <Zap size={14} />
                            <span className="font-bold">Lossless Audio Enabled</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Bitrate</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[320, 256, 192, 128].map((bitrate) => (
                                    <button
                                        key={bitrate}
                                        onClick={() => handleChange('audioBitrate', bitrate)}
                                        className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${options.audioBitrate === bitrate
                                            ? 'bg-brand-orange/20 border-brand-orange text-brand-orange'
                                            : 'bg-white/5 border-transparent text-zinc-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {bitrate}k
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </Section>
            )}

            {/* SECTION: COMPRESSION (Video Only, Non-GIF) */}
            {!isAudio && options.format !== 'gif' && (
                <Section title="Compression" icon={<Layers size={14} />}>
                    <div className="bg-black/40 p-1 rounded-xl border border-white/5 flex mb-4">
                        <TabButton
                            active={options.compressionMode === 'quality'}
                            onClick={() => handleChange('compressionMode', 'quality')}
                            label="Constant Quality"
                        />
                        <TabButton
                            active={options.compressionMode === 'target'}
                            onClick={() => handleChange('compressionMode', 'target')}
                            label="Target Size"
                        />
                    </div>

                    {/* Constant Quality Slider */}
                    {options.compressionMode === 'quality' && (
                        <div className="px-1 space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-xs text-zinc-400">CRF Value</span>
                                <span className="text-lg font-bold text-brand-yellow font-mono">{options.quality}</span>
                            </div>
                            <input
                                type="range"
                                min="18"
                                max="51"
                                value={options.quality}
                                onChange={(e) => handleChange('quality', parseInt(e.target.value))}
                                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-yellow hover:accent-brand-orange transition-all"
                            />
                            <div className="flex justify-between text-[10px] text-zinc-600 uppercase font-bold tracking-wider">
                                <span>High Quality</span>
                                <span>Low Size</span>
                            </div>
                        </div>
                    )}

                    {/* Target Size Inputs */}
                    {options.compressionMode === 'target' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6 gap-2">
                                {[{ l: 'Discord', s: 25 }, { l: 'Email', s: 10 }, { l: 'HD', s: 100 }].map((p) => (
                                    <button
                                        key={p.l}
                                        onClick={() => handleChange('targetSize', p.s)}
                                        className={`p-2 rounded-lg border text-xs transition-all ${options.targetSize === p.s
                                            ? 'bg-brand-orange/20 border-brand-orange text-brand-orange'
                                            : 'bg-white/5 border-transparent text-zinc-400 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="font-bold">{p.l}</div>
                                        <div className="text-[10px] opacity-70">{p.s}MB</div>
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={options.targetSize}
                                    onChange={(e) => handleChange('targetSize', parseFloat(e.target.value) || 1)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pr-12 text-sm text-white font-mono focus:outline-none focus:border-brand-yellow/50"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-bold">MB</span>
                            </div>
                            <div className="text-[10px] text-zinc-500 text-center">
                                Estimated Bitrate: <span className="text-zinc-300 font-mono">
                                    {duration > 0
                                        ? `${Math.round(((options.targetSize * 8192) / (options.trimEnd ? options.trimEnd - options.trimStart : duration)))} kbps`
                                        : 'Calculating...'
                                    }
                                </span>
                            </div>
                        </div>
                    )}
                </Section>
            )}

            {/* SECTION: GIF Options */}
            {options.format === 'gif' && (
                <Section title="GIF Quality" icon={<ImageIcon size={14} />}>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleChange('gifMode', 'basic')}
                            className={`p-3 rounded-xl border text-left transition-all ${options.gifMode === 'basic'
                                ? 'bg-brand-yellow/10 border-brand-yellow text-white'
                                : 'bg-white/5 border-transparent text-zinc-400 hover:bg-white/10'
                                }`}
                        >
                            <div className="text-xs font-bold mb-1">Basic</div>
                            <div className="text-[10px] opacity-60">Faster, standard color palette.</div>
                        </button>
                        <button
                            onClick={() => handleChange('gifMode', 'pro')}
                            className={`p-3 rounded-xl border text-left transition-all ${options.gifMode === 'pro'
                                ? 'bg-brand-yellow/10 border-brand-yellow text-white'
                                : 'bg-white/5 border-transparent text-zinc-400 hover:bg-white/10'
                                }`}
                        >
                            <div className="text-xs font-bold mb-1 flex items-center gap-2">
                                Pro <span className="bg-brand-yellow text-black text-[9px] px-1 rounded font-bold">HQ</span>
                            </div>
                            <div className="text-[10px] opacity-60">High quality palette generation.</div>
                        </button>
                    </div>
                </Section>
            )}

            {/* SECTION: SPEED */}
            <Section title="Speed" icon={<Gauge size={14} />} rightElement={<span className="text-xs font-mono text-brand-yellow">{options.speed}x</span>}>
                <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={options.speed}
                    onChange={(e) => handleChange('speed', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-yellow hover:accent-brand-orange transition-all"
                />
                <div className="flex justify-between text-[10px] text-zinc-600 font-mono mt-2">
                    <span>0.5x</span>
                    <span>1.0x</span>
                    <span>2.0x</span>
                </div>
            </Section>

            {/* SECTION: EXTRAS */}
            <div className="pt-4 border-t border-white/5">
                <div
                    onClick={() => handleChange('removeAudio', !options.removeAudio)}
                    className="flex items-center justify-between group cursor-pointer p-2 -mx-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${options.removeAudio ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-zinc-400'}`}>
                            <VolumeX size={16} />
                        </div>
                        <span className={`text-sm font-medium transition-colors ${options.removeAudio ? 'text-white' : 'text-zinc-400'}`}>Remove Audio</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${options.removeAudio ? 'bg-brand-orange' : 'bg-zinc-700'}`}>
                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${options.removeAudio ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                </div>
            </div>

        </div>
    );
}

// --- SUBCOMPONENTS ---

function Section({ title, icon, children, rightElement }: { title: string, icon: React.ReactNode, children: React.ReactNode, rightElement?: React.ReactNode }) {
    return (
        <div className="rounded-2xl bg-black/20 border border-white/5 p-5 hover:bg-black/30 transition-colors duration-300 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-white/5 text-brand-yellow">
                        {icon}
                    </div>
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">{title}</h3>
                </div>
                {rightElement}
            </div>
            {children}
        </div>
    );
}

function TimeInput({ label, value, max, onChange, formatTime, isEnd = false }: { label: string, value: number | null, max: number, onChange: (v: number | null) => void, formatTime: (s: number) => string, isEnd?: boolean }) {
    return (
        <div className="flex-1 space-y-2">
            <label className="text-[10px] text-zinc-500 font-bold uppercase pl-1">{label}</label>
            <div className="relative group">
                <input
                    type="number"
                    value={value ?? ''}
                    placeholder={isEnd ? "End" : "0"}
                    min={0}
                    max={max}
                    step={0.1}
                    onChange={(e) => {
                        const v = e.target.value === '' ? null : parseFloat(e.target.value);
                        onChange(v);
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-brand-yellow/50 transition-colors placeholder:text-zinc-700 shadow-inner"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 pointer-events-none group-focus-within:text-brand-yellow transition-colors">
                    {value !== null ? formatTime(value) : '--:--'}
                </div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${active ? 'bg-zinc-700 text-white shadow-lg shadow-black/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
        >
            {label}
        </button>
    );
}
