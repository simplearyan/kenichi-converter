import { Zap } from 'lucide-react';

interface LandingPageProps {
    onOpenDialog: () => void;
}

export function LandingPage({ onOpenDialog }: LandingPageProps) {
    return (
        <div className="flex-1 flex items-center justify-center">
            <div
                onClick={onOpenDialog}
                className="group relative cursor-pointer"
            >
                <div className="absolute -inset-1 bg-linear-to-r from-brand-yellow to-brand-orange rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative glass-panel rounded-2xl p-12 text-center flex flex-col items-center gap-6 max-w-md w-full hover:scale-[1.02] transition-transform duration-300">
                    <div className="w-20 h-20 bg-black/40 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner group-hover:border-brand-yellow/30 transition-colors">
                        <Zap size={40} className="text-zinc-500 group-hover:text-brand-yellow transition-colors duration-300" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-zinc-400">
                            Import Media
                        </h2>
                        <p className="text-zinc-500 mt-2 text-sm leading-relaxed">
                            Drag and drop video or audio files here,<br />or click to browse system.
                        </p>
                    </div>
                    <div className="flex gap-3 text-[10px] text-zinc-600 uppercase tracking-wider font-bold">
                        <span className="px-2 py-1 bg-white/5 rounded">MP4</span>
                        <span className="px-2 py-1 bg-white/5 rounded">MOV</span>
                        <span className="px-2 py-1 bg-white/5 rounded">MKV</span>
                        <span className="px-2 py-1 bg-white/5 rounded">MP3</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
