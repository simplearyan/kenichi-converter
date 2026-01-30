interface ProgressBarProps {
    progress: number;
    status: 'idle' | 'converting' | 'completed' | 'error';
}

export default function ProgressBar({ progress, status }: ProgressBarProps) {
    const getColor = () => {
        if (status === 'error') return 'bg-red-500';
        if (status === 'completed') return 'bg-green-500';
        return 'bg-brand-orange';
    };

    return (
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-4">
            <div
                className={`h-full transition-all duration-300 ${getColor()} ${status === 'converting' ? 'animate-pulse' : ''}`}
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
        </div>
    );
}
