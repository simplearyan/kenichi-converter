import { Zap, Minus, Square, X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function TitleBar() {
    const minimizeWindow = () => getCurrentWindow().minimize();
    const toggleMaximize = () => getCurrentWindow().toggleMaximize();
    const closeWindow = () => getCurrentWindow().close();

    return (
        <div
            data-tauri-drag-region
            className="h-10 flex items-center justify-between px-4 bg-transparent border-b border-white/5 shrink-0 z-50"
        >
            <div className="flex items-center gap-2 pointer-events-none opacity-80">
                <Zap size={14} className="text-brand-yellow" />
                <span className="text-xs font-bold tracking-widest uppercase">Kenichi Converter</span>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={minimizeWindow}
                    className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-zinc-400 hover:text-white"
                    title="Minimize"
                >
                    <Minus size={14} />
                </button>
                <button
                    onClick={toggleMaximize}
                    className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-zinc-400 hover:text-white"
                    title="Maximize"
                >
                    <Square size={12} />
                </button>
                <button
                    onClick={closeWindow}
                    className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-colors text-zinc-400"
                    title="Close"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}
