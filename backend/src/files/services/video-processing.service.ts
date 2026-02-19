import { Injectable, Logger } from '@nestjs/common';
import Ffmpeg from 'fluent-ffmpeg';
import { join } from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { storageConfig } from '../config/storage.config';

export interface VideoMetadata {
    duration: number; // Duration in seconds
    width: number;
    height: number;
    bitrate: number;
    codec: string;
    format: string;
}

export interface ProcessedVideoResult {
    thumbnailPath: string;
    thumbnailUrl: string;
    metadata: VideoMetadata;
    compressedPath?: string;
    compressedUrl?: string;
}

@Injectable()
export class VideoProcessingService {
    private readonly logger = new Logger(VideoProcessingService.name);
    private readonly uploadPath: string;

    constructor() {
        this.uploadPath = join(process.cwd(), storageConfig.local.path);
        this.ensureDirectories();
    }

    private async ensureDirectories(): Promise<void> {
        try {
            await fs.access(this.uploadPath);
        } catch {
            await fs.mkdir(this.uploadPath, { recursive: true });
        }
    }

    /**
     * Check if file is a video
     */
    isVideo(mimeType: string): boolean {
        return storageConfig.allowedTypes.videos.includes(mimeType);
    }

    /**
     * Extract video metadata
     */
    async getVideoMetadata(filePath: string): Promise<VideoMetadata> {
        return new Promise((resolve, reject) => {
            Ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) {
                    reject(err);
                    return;
                }

                const videoStream = metadata.streams.find(
                    (stream) => stream.codec_type === 'video',
                );

                if (!videoStream) {
                    reject(new Error('No video stream found'));
                    return;
                }

                resolve({
                    duration: metadata.format.duration || 0,
                    width: videoStream.width || 0,
                    height: videoStream.height || 0,
                    bitrate: parseInt(String(metadata.format.bit_rate || '0'), 10),
                    codec: videoStream.codec_name || 'unknown',
                    format: metadata.format.format_name || 'unknown',
                });
            });
        });
    }

    /**
     * Generate video thumbnail
     */
    async generateThumbnail(
        filePath: string,
        outputPath: string,
        timestamp: number = 1, // Seconds into video
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            Ffmpeg(filePath)
                .screenshots({
                    timestamps: [timestamp],
                    filename: 'thumbnail.jpg',
                    folder: outputPath,
                    size: '320x240',
                })
                .on('end', () => {
                    const thumbnailPath = join(outputPath, 'thumbnail.jpg');
                    resolve(thumbnailPath);
                })
                .on('error', (err) => {
                    reject(err);
                });
        });
    }

    /**
     * Compress video
     */
    async compressVideo(
        inputPath: string,
        outputPath: string,
        quality: 'low' | 'medium' | 'high' = 'medium',
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            const qualitySettings = {
                low: { crf: 28, preset: 'fast' },
                medium: { crf: 23, preset: 'medium' },
                high: { crf: 18, preset: 'slow' },
            };

            const settings = qualitySettings[quality];

            Ffmpeg(inputPath)
                .videoCodec('libx264')
                .audioCodec('aac')
                .outputOptions([
                    `-crf ${settings.crf}`,
                    `-preset ${settings.preset}`,
                    '-movflags +faststart', // Web optimization
                ])
                .output(outputPath)
                .on('end', () => {
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    reject(err);
                })
                .on('progress', (progress) => {
                    this.logger.debug(
                        `Video compression progress: ${Math.round(progress.percent || 0)}%`,
                    );
                })
                .run();
        });
    }

    /**
     * Convert video format
     */
    async convertVideoFormat(
        inputPath: string,
        outputPath: string,
        format: 'mp4' | 'webm' | 'mov',
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            let command = Ffmpeg(inputPath);

            switch (format) {
                case 'mp4':
                    command = command
                        .videoCodec('libx264')
                        .audioCodec('aac')
                        .format('mp4');
                    break;
                case 'webm':
                    command = command
                        .videoCodec('libvpx-vp9')
                        .audioCodec('libopus')
                        .format('webm');
                    break;
                case 'mov':
                    command = command
                        .videoCodec('libx264')
                        .audioCodec('aac')
                        .format('mov');
                    break;
            }

            command
                .output(outputPath)
                .on('end', () => {
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    reject(err);
                })
                .on('progress', (progress) => {
                    this.logger.debug(
                        `Video conversion progress: ${Math.round(progress.percent || 0)}%`,
                    );
                })
                .run();
        });
    }

    /**
     * Process video: generate thumbnail and optionally compress
     */
    async processVideo(
        filePath: string,
        filename: string,
        generateThumbnail: boolean = true,
        compress: boolean = false,
    ): Promise<ProcessedVideoResult> {
        const ext = extname(filename);
        const baseFilename = uuidv4();
        const baseUrl = storageConfig.local.baseUrl;

        // Get video metadata
        const metadata = await this.getVideoMetadata(filePath);

        let thumbnailPath: string | undefined;
        let thumbnailUrl: string | undefined;
        let compressedPath: string | undefined;
        let compressedUrl: string | undefined;

        // Generate thumbnail
        if (generateThumbnail) {
            const thumbnailDir = join(this.uploadPath, 'thumbnails');
            await fs.mkdir(thumbnailDir, { recursive: true });

            const thumbnailFilename = `${baseFilename}_thumb.jpg`;
            thumbnailPath = await this.generateThumbnail(
                filePath,
                thumbnailDir,
                Math.min(1, metadata.duration / 2), // Use 1 second or middle of video
            );

            // Rename thumbnail to match our naming convention
            const newThumbnailPath = join(thumbnailDir, thumbnailFilename);
            await fs.rename(thumbnailPath, newThumbnailPath);
            thumbnailPath = newThumbnailPath;
            thumbnailUrl = `${baseUrl}/thumbnails/${thumbnailFilename}`;
        }

        // Compress video if requested
        if (compress && metadata.bitrate > 2000000) {
            // Only compress if bitrate > 2Mbps
            const compressedFilename = `${baseFilename}_compressed${ext}`;
            compressedPath = join(this.uploadPath, compressedFilename);
            await this.compressVideo(filePath, compressedPath, 'medium');
            compressedUrl = `${baseUrl}/${compressedFilename}`;
        }

        return {
            thumbnailPath: thumbnailPath || '',
            thumbnailUrl: thumbnailUrl || '',
            metadata,
            compressedPath,
            compressedUrl,
        };
    }

    /**
     * Extract video duration
     */
    async extractDuration(filePath: string): Promise<number> {
        const metadata = await this.getVideoMetadata(filePath);
        return Math.round(metadata.duration);
    }
}
