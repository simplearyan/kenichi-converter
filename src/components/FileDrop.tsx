import { useState, useEffect } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open } from "@tauri-apps/plugin-dialog";

interface FileDropProps {
    onFileSelect: (path: string, name: string) => void;
}

export default function FileDrop({ onFileSelect }: FileDropProps) {
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        // Tauri v2 native file drop listener
        const unlistenPromise = getCurrentWebview().onDragDropEvent((event) => {
            if (event.payload.type === 'enter') {
                setIsDragging(true);
            } else if (event.payload.type === 'drop') {
                setIsDragging(false);
                const droppedFiles = event.payload.paths;
                if (droppedFiles && droppedFiles.length > 0) {
                    const file = droppedFiles[0];
                    const name = file.split(/[\\/]/).pop() || file;
                    onFileSelect(file, name);
                }
            } else {
                setIsDragging(false);
            }
        });

        return () => {
            unlistenPromise.then(unlisten => unlisten());
        };
    }, [onFileSelect]);

    const handleOpen = async () => {
        try {
            const file = await open({
                multiple: false,
                filters: [{
                    name: 'Video',
                    extensions: ['mp4', 'mkv', 'mov', 'avi', 'webm']
                }]
            });
            if (file) {
                if (typeof file === 'string') {
                    const name = file.split(/[\\/]/).pop() || file;
                    onFileSelect(file, name);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div
            className={`
                h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all
                ${isDragging ? 'border-brand-yellow bg-brand-yellow/10 animate-pulse' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}
            `}
            onClick={handleOpen}
        >
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4 text-2xl">
                {isDragging ? '📥' : '📂'}
            </div>
            <p className="text-zinc-400 font-medium">Click or Drag video here</p>
            <p className="text-xs text-zinc-500 mt-2">Supports MP4, MKV, AVI, MOV</p>
        </div>
    );
}
