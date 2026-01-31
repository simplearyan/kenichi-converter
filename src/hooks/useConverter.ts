import { useState, useCallback, useRef } from 'react';
import { Command } from '@tauri-apps/plugin-shell';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { VideoOptions } from '../types';
import { buildFFmpegArgs } from '../utils/ffmpegUtils';

export function useConverter() {
    const [status, setStatus] = useState<string>('idle');
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);

    // Track logs to avoid spamming the same progress %
    const lastLoggedProgressRef = useRef<number>(-1);

    // Ref to track total duration for progress calculation locally within command logs
    const totalDurationRef = useRef(0);

    const playSuccessSound = useCallback(() => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
            oscillator.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.1); // E6

            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
        } catch (e) {
            console.error("Failed to play sound:", e);
        }
    }, []);

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
                const roundedP = Math.round(p);

                setProgress(roundedP);

                // Log every 10% to avoid terminal flood
                if (roundedP % 10 === 0 && roundedP !== lastLoggedProgressRef.current && roundedP > 0) {
                    addLog(`Progress: ${roundedP}%`);
                    lastLoggedProgressRef.current = roundedP;
                }
            }
        }
    }, [addLog]);

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
            lastLoggedProgressRef.current = -1;

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
                // Stdout is usually empty for ffmpeg unless -v is redirected, but we keep for safety
                parseProgress(line);
            });

            command.stderr.on('data', (line) => {
                // FFmpeg output is largely on stderr
                parseProgress(line);
            });

            const output = await command.execute();

            if (output.code === 0) {
                setStatus('idle');
                setProgress(100);
                addLog('Progress: 100%');
                addLog('Conversion Successful! 🎉');

                // Audio & Notification
                playSuccessSound();

                try {
                    let hasPermission = await isPermissionGranted();
                    if (!hasPermission) {
                        const permission = await requestPermission();
                        hasPermission = permission === 'granted';
                    }
                    if (hasPermission) {
                        sendNotification({
                            title: 'Kenichi Converter',
                            body: 'Conversion Finished Successfully! 🎉'
                        });
                    }
                } catch (err) {
                    console.warn("Notification error:", err);
                }

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
    }, [addLog, parseProgress, playSuccessSound]);

    return {
        status,
        progress,
        logs,
        setLogs,
        convert,
        isConverting: status === 'converting'
    };
}
