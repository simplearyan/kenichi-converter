import { useState, useCallback, useRef } from 'react';
import { Command } from '@tauri-apps/plugin-shell';
import { VideoOptions } from '../types';
import { buildFFmpegArgs } from '../utils/ffmpegUtils';

export function useConverter() {
    const [status, setStatus] = useState<string>('idle');
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);

    // Ref to track total duration for progress calculation locally within command logs
    const totalDurationRef = useRef(0);

    const addLog = useCallback((msg: string) => {
        setLogs(prev => [...prev, msg].slice(-100));
    }, []);

    const parseProgress = useCallback((msg: string) => {
        if (msg.includes("time=") && totalDurationRef.current > 0) {
            const match = msg.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
            if (match) {
                const hours = parseFloat(match[1]);
                const minutes = parseFloat(match[2]);
                const seconds = parseFloat(match[3]);
                const currentTime = hours * 3600 + minutes * 60 + seconds;
                const p = Math.min(100, (currentTime / totalDurationRef.current) * 100);
                setProgress(Math.round(p));
            }
        }
    }, []);

    const convert = useCallback(async (
        filePath: string,
        savePath: string,
        options: VideoOptions,
        duration: number
    ) => {
        try {
            setStatus('converting');
            setLogs([]);
            setProgress(0);

            // Set for progress parsing
            let calcDuration = duration;
            if (options.trimEnd !== null && options.trimEnd > (options.trimStart || 0)) {
                calcDuration = options.trimEnd - (options.trimStart || 0);
            }
            totalDurationRef.current = calcDuration;

            addLog(`Starting conversion: ${filePath} -> ${savePath}`);

            const args = buildFFmpegArgs(filePath, options, duration, savePath);
            addLog(`Command: ffmpeg ${args.join(' ')}`);

            const command = Command.sidecar('bin/ffmpeg', args);

            command.stdout.on('data', (line) => {
                addLog(line);
                parseProgress(line);
            });

            command.stderr.on('data', (line) => {
                addLog(line);
                parseProgress(line);
            });

            const output = await command.execute();

            if (output.code === 0) {
                setStatus('idle');
                setProgress(100);
                addLog('Conversion Successful! 🎉');
                return true;
            } else {
                setStatus('error');
                addLog(`Error: Process finished with code ${output.code}`);
                return false;
            }
        } catch (e) {
            console.error(e);
            setStatus('error');
            addLog(`Exception: ${e}`);
            return false;
        }
    }, [addLog, parseProgress]);

    return {
        status,
        progress,
        logs,
        setLogs,
        convert,
        isConverting: status === 'converting'
    };
}
