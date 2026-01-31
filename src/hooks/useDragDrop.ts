import { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';

export function useDragDrop(onDrop: (path: string) => void) {
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        let unlisteners: (() => void)[] = [];

        async function setupDragDrop() {
            const unlistenEnter = await listen('tauri://drag-enter', () => {
                setIsDragging(true);
            });

            const unlistenLeave = await listen('tauri://drag-leave', () => {
                setIsDragging(false);
            });

            const unlistenDrop = await listen<{ paths: string[] }>('tauri://drag-drop', (event) => {
                setIsDragging(false);
                if (event.payload.paths && event.payload.paths.length > 0) {
                    onDrop(event.payload.paths[0]);
                }
            });

            unlisteners.push(unlistenEnter, unlistenLeave, unlistenDrop);
        }

        setupDragDrop();

        return () => {
            unlisteners.forEach(unlisten => unlisten());
        };
    }, [onDrop]);

    return { isDragging };
}
