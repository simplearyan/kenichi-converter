import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { Command } from '@tauri-apps/plugin-shell';
import { VideoOptions, DEFAULT_OPTIONS } from '../types';

export function useFileProcessing(setOptions: (options: VideoOptions) => void, addLog: (msg: string) => void) {
    const [filePath, setFilePath] = useState<string | null>(null);
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);

    const getMetadata = useCallback(async (path: string) => {
        try {
            const command = Command.sidecar('bin/ffprobe', [
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                path
            ]);
            const output = await command.execute();
            if (output.code === 0) {
                const d = parseFloat(output.stdout);
                setDuration(d);
                return d;
            }
        } catch (e) {
            console.error('Error getting metadata:', e);
            addLog(`Metadata Error: ${e}`);
        }
        return 0;
    }, [addLog]);

    const generateThumbnail = useCallback(async (path: string) => {
        try {
            const cacheDir = await invoke<string>('get_app_cache_dir');
            const sep = navigator.userAgent.includes('Windows') ? '\\' : '/';
            const outputPath = `${cacheDir}${sep}thumbnail.jpg`;

            const args = [
                '-y',
                '-ss', '00:00:01',
                '-i', path,
                '-vframes', '1',
                '-q:v', '2',
                outputPath
            ];

            const command = Command.sidecar('bin/ffmpeg', args);
            const result = await command.execute();

            if (result.code === 0) {
                const fileBytes = await readFile(outputPath);
                const base64String = btoa(
                    new Uint8Array(fileBytes)
                        .reduce((data, byte) => data + String.fromCharCode(byte), '')
                );
                setThumbnail(`data:image/jpeg;base64,${base64String}`);
            }
        } catch (e) {
            console.error('Error generating thumbnail:', e);
            addLog(`Thumbnail Hint: ${e}`);
        }
    }, [addLog]);

    const handleFileSelect = useCallback((path: string) => {
        setFilePath(path);
        setThumbnail(null);
        setDuration(0);
        setOptions(DEFAULT_OPTIONS);
        addLog(`Loaded file: ${path}`);
        generateThumbnail(path);
        getMetadata(path);
    }, [addLog, generateThumbnail, getMetadata, setOptions]);

    const openFileDialog = useCallback(async () => {
        try {
            const file = await open({
                multiple: false,
                filters: [{
                    name: 'Media',
                    extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'mp3', 'wav', 'flac', 'm4a']
                }]
            });
            if (file) {
                handleFileSelect(file as string);
            }
        } catch (err) {
            console.error("Failed to open file dialog", err);
            addLog(`Dialog Error: ${err}`);
        }
    }, [handleFileSelect, addLog]);

    return {
        filePath,
        thumbnail,
        duration,
        handleFileSelect,
        openFileDialog
    };
}
