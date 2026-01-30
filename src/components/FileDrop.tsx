import { useState, useRef } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { open } from "@tauri-apps/plugin-dialog";
// import { listen } from "@tauri-apps/api/event"; // For file drop event if we need it directly or use internal hook
// Actually, Tauri v2 file drop is slightly different, let's stick to standard HTML drag and drop first or listen to 'tauri://drag-drop'.
// For simplicity, we'll use a button + drag zone.

interface FileDropProps {
    onFileSelect: (path: string, name: string) => void;
}

export default function FileDrop({ onFileSelect }: FileDropProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        // Note: HTML5 dnd with Tauri works if configured. 
        // Typically tauri://file-drop event is safer for OS Drag/Drop.
        // Let's implement the button click first as primary.
    };

    // For Tauri v2 file drop, it's best to listen to the event globally in App.tsx 
    // or use the window listener. Here we will focus on the UI surface.

    // Actually, let's implement the standard dialog opener here.
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
                // In v2, file return type might be string or object depending on config.
                // Usually it returns path string(s).
                if (typeof file === 'string') {
                    // Extract name
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
                ${isDragging ? 'border-brand-yellow bg-brand-yellow/10' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}
            `}
            onClick={handleOpen}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4 text-2xl">
                📂
            </div>
            <p className="text-zinc-400 font-medium">Click or Drag video here</p>
            <p className="text-xs text-zinc-500 mt-2">Supports MP4, MKV, AVI, MOV</p>
        </div>
    );
}
