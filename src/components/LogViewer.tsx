import { useEffect, useRef } from "react";

interface LogViewerProps {
    logs: string[];
}

export default function LogViewer({ logs }: LogViewerProps) {
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    return (
        <div className="flex-1 bg-black/80 rounded-xl overflow-hidden border border-white/5 font-mono text-xs flex flex-col min-h-0">
            <div className="px-3 py-2 bg-white/5 border-b border-white/5 flex justify-between items-center">
                <span className="text-zinc-400 font-bold uppercase tracking-wider">Console Output</span>
                <span className="text-zinc-600">{logs.length} lines</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {logs.length === 0 && (
                    <div className="text-zinc-700 italic text-center mt-10">
                        Waiting for process to start...
                    </div>
                )}
                {logs.map((log, i) => (
                    <div key={i} className="break-all whitespace-pre-wrap text-zinc-300">
                        <span className="text-zinc-600 mr-2 select-none">$</span>
                        {log}
                    </div>
                ))}
                <div ref={endRef} />
            </div>
        </div>
    );
}
