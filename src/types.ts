export interface VideoOptions {
    format: 'mp4' | 'mkv' | 'avi' | 'mov' | 'webm' | 'gif';
    resolution: 'original' | '1080p' | '720p' | '480p';
    quality: number; // 0-51 (CRF)
    speed: number; // 0.5 - 2.0
    removeAudio: boolean;
}

export const DEFAULT_OPTIONS: VideoOptions = {
    format: 'mp4',
    resolution: 'original',
    quality: 23,
    speed: 1.0,
    removeAudio: false
};
