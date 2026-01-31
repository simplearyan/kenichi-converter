import { useRef, useEffect } from 'react';

interface ActivityTerminalProps {
    logs: string[];
    onClear: () => void;
    children?: React.ReactNode;
}

export function ActivityTerminal({ logs, onClear, children }: ActivityTerminalProps) {
    const consoleEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="flex-1 glass-panel rounded-2xl flex flex-col min-h-0 overflow-hidden relative">
            <div className="px-4 py-2 border-b border-white/5 bg-black/20 flex justify-between items-center shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    Activity Log
                </span>
                <button
                    onClick={onClear}
                    className="text-[10px] text-zinc-600 hover:text-white transition-colors"
                >
                    Clear
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[11px] custom-scrollbar">
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
                <div ref={consoleEndRef} />
            </div>

            {/* Injected footer (ActionCenter) */}
            {children}
        </div>
    );
}
