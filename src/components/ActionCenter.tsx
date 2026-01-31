import { RefreshCw, Zap } from 'lucide-react';

interface ActionCenterProps {
    status: string;
    progress: number;
    isConverting: boolean;
    onConvert: () => void;
}

export function ActionCenter({ status, progress, isConverting, onConvert }: ActionCenterProps) {
    return (
        <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md shrink-0">
            <div className="mb-4">
                {/* Status Bar */}
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
                onClick={onConvert}
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
                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                        <Zap size={18} className={isConverting ? '' : 'text-brand-orange'} />
                        <span>Start Process</span>
                    </>
                )}
            </button>
        </div>
    );
}
