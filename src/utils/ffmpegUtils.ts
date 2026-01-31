import { VideoOptions } from '../types';

/**
 * Builds the FFmpeg arguments based on the user-selected options.
 */
export function buildFFmpegArgs(
    filePath: string,
    options: VideoOptions,
    duration: number,
    savePath: string
): string[] {
    const args: string[] = [];

    // Trimming (Start)
    if (options.trimStart && options.trimStart > 0) {
        args.push('-ss', options.trimStart.toString());
    }

    // Input
    args.push('-i', filePath);

    // Trimming (Duration)
    if (options.trimEnd !== null && options.trimEnd > (options.trimStart || 0)) {
        const clipDuration = options.trimEnd - (options.trimStart || 0);
        args.push('-t', clipDuration.toString());
    }

    // -- FILTER CONSTRUCTION --
    const filterChains: string[] = [];
    let vLabel = '0:v';
    let aLabel = '0:a';
    const vFilters: string[] = [];

    // Video Filters (Speed & Scaling)
    if (options.speed !== 1.0) {
        const setpts = (1 / options.speed).toFixed(2);
        vFilters.push(`setpts=${setpts}*PTS`);
    }

    if (options.resolution !== 'original') {
        const height = options.resolution.replace('p', '');
        vFilters.push(`scale=-2:${height}:flags=lanczos`);
    }

    if (vFilters.length > 0) {
        filterChains.push(`[${vLabel}]${vFilters.join(',')}[v_processed]`);
        vLabel = 'v_processed';
    }

    // GIF Pro Mode (Palette processing)
    if (options.format === 'gif' && options.gifMode === 'pro') {
        filterChains.push(`[${vLabel}]split[a][b]`);
        filterChains.push(`[a]palettegen[p]`);
        filterChains.push(`[b][p]paletteuse[v_final]`);
        vLabel = 'v_final';
    }

    // Audio Filters (Speed)
    const isAudioOnly = ['mp3', 'wav', 'flac', 'm4a'].includes(options.format);
    if (!options.removeAudio && options.format !== 'gif') {
        if (options.speed !== 1.0) {
            filterChains.push(`[${aLabel}]atempo=${options.speed}[a_processed]`);
            aLabel = 'a_processed';
        }
    }

    // Assemble Filter Complex if any filters were added
    if (filterChains.length > 0) {
        args.push('-filter_complex', filterChains.join(';'));
    }

    const formatLabel = (label: string) => (label.includes(':') ? label : `[${label}]`);

    // Mappings
    if (isAudioOnly) {
        args.push('-vn'); // No video
        const audioTarget = options.speed !== 1.0 ? aLabel : '0:a';
        args.push('-map', formatLabel(audioTarget));

        if (['mp3', 'm4a'].includes(options.format)) {
            args.push('-b:a', `${options.audioBitrate}k`);
        }
    } else {
        // Video Mapping
        args.push('-map', formatLabel(vLabel));

        // Audio Mapping
        if (!options.removeAudio && options.format !== 'gif') {
            const audioTarget = options.speed !== 1.0 ? aLabel : '0:a';
            args.push('-map', formatLabel(audioTarget));
        }
    }

    // Video Quality & Bitrate Control
    if (!isAudioOnly && options.format !== 'gif') {
        if (options.compressionMode === 'target') {
            let calcDuration = duration;
            if (options.trimEnd !== null && options.trimEnd > (options.trimStart || 0)) {
                calcDuration = options.trimEnd - (options.trimStart || 0);
            }

            if (calcDuration > 0 && options.targetSize > 0) {
                const targetBits = options.targetSize * 8 * 1024 * 1024;
                let totalBitrate = Math.floor(targetBits / calcDuration);

                // Reserve some bitrate for audio if present
                const audioBitrate = 128000;
                let videoBitrate = totalBitrate;
                if (!options.removeAudio) videoBitrate -= audioBitrate;

                if (videoBitrate < 100000) videoBitrate = 100000; // Floor at 100kbps

                args.push('-b:v', videoBitrate.toString());
                args.push('-maxrate', videoBitrate.toString());
                args.push('-bufsize', (videoBitrate * 2).toString());
                if (!options.removeAudio) args.push('-b:a', '128k');
            } else {
                args.push('-crf', '23');
            }
        } else {
            args.push('-crf', options.quality.toString());
        }
    }

    // Final Output Path & Overwrite
    args.push('-y', savePath);

    return args;
}
