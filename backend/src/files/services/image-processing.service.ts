import { Injectable, Logger } from '@nestjs/common';
import sharp = require('sharp');
import { join } from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { storageConfig } from '../config/storage.config';

export interface ImageVariants {
    original: string;
    thumbnail?: string;
    medium?: string;
    full?: string;
}

export interface ProcessedImageResult {
    variants: ImageVariants;
    metadata: {
        width: number;
        height: number;
        format: string;
        size: number;
    };
}

@Injectable()
export class ImageProcessingService {
    private readonly logger = new Logger(ImageProcessingService.name);
    private readonly uploadPath: string;

    // Image size configurations
    private readonly sizes = {
        thumbnail: { width: 150, height: 150 },
        medium: { width: 800, height: 800 },
        full: { width: 1920, height: 1920 },
    };

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
     * Check if file is an image
     */
    isImage(mimeType: string): boolean {
        return storageConfig.allowedTypes.images.includes(mimeType);
    }

    /**
     * Process image: compress, generate variants, remove EXIF
     */
    async processImage(
        file: Express.Multer.File,
        userId: string,
        generateVariants: boolean = true,
    ): Promise<ProcessedImageResult> {
        if (!this.isImage(file.mimetype)) {
            throw new Error('File is not an image');
        }

        const ext = extname(file.originalname);
        const baseFilename = uuidv4();
        const variants: ImageVariants = {
            original: `${baseFilename}${ext}`,
        };

        let sharpInstance = sharp(file.buffer);

        // Remove EXIF data for privacy
        sharpInstance = sharpInstance.rotate(); // This removes EXIF orientation
        const metadata = await sharpInstance.metadata();

        // Get original dimensions
        const width = metadata.width || 0;
        const height = metadata.height || 0;
        const format = metadata.format || 'jpeg';

        // Process original (compressed, no EXIF)
        const originalPath = join(this.uploadPath, variants.original);

        // Process based on format
        let processedSharp = sharpInstance;
        if (format === 'jpeg' || format === 'jpg') {
            processedSharp = processedSharp.jpeg({ quality: 85, mozjpeg: true });
        } else if (format === 'png') {
            processedSharp = processedSharp.png({ quality: 85, compressionLevel: 9 });
        } else if (format === 'webp') {
            processedSharp = processedSharp.webp({ quality: 85 });
        } else {
            // Convert to JPEG for other formats
            processedSharp = processedSharp.jpeg({ quality: 85, mozjpeg: true });
        }

        await processedSharp.toFile(originalPath);

        const originalStats = await fs.stat(originalPath);

        // Generate variants if requested
        if (generateVariants) {
            // Thumbnail
            if (width > this.sizes.thumbnail.width || height > this.sizes.thumbnail.height) {
                const thumbnailFilename = `${baseFilename}_thumb${ext}`;
                variants.thumbnail = thumbnailFilename;
                const thumbnailPath = join(this.uploadPath, thumbnailFilename);

                let thumbSharp = sharp(file.buffer).resize(
                    this.sizes.thumbnail.width,
                    this.sizes.thumbnail.height,
                    {
                        fit: 'cover',
                        position: 'center',
                    },
                );

                if (format === 'jpeg' || format === 'jpg') {
                    thumbSharp = thumbSharp.jpeg({ quality: 80, mozjpeg: true });
                } else if (format === 'png') {
                    thumbSharp = thumbSharp.png({ quality: 80 });
                } else if (format === 'webp') {
                    thumbSharp = thumbSharp.webp({ quality: 80 });
                } else {
                    thumbSharp = thumbSharp.jpeg({ quality: 80, mozjpeg: true });
                }

                await thumbSharp.toFile(thumbnailPath);
            }

            // Medium size
            if (width > this.sizes.medium.width || height > this.sizes.medium.height) {
                const mediumFilename = `${baseFilename}_medium${ext}`;
                variants.medium = mediumFilename;
                const mediumPath = join(this.uploadPath, mediumFilename);

                let mediumSharp = sharp(file.buffer).resize(
                    this.sizes.medium.width,
                    this.sizes.medium.height,
                    {
                        fit: 'inside',
                        withoutEnlargement: true,
                    },
                );

                if (format === 'jpeg' || format === 'jpg') {
                    mediumSharp = mediumSharp.jpeg({ quality: 85, mozjpeg: true });
                } else if (format === 'png') {
                    mediumSharp = mediumSharp.png({ quality: 85 });
                } else if (format === 'webp') {
                    mediumSharp = mediumSharp.webp({ quality: 85 });
                } else {
                    mediumSharp = mediumSharp.jpeg({ quality: 85, mozjpeg: true });
                }

                await mediumSharp.toFile(mediumPath);
            }

            // Full size (max 1920px)
            if (width > this.sizes.full.width || height > this.sizes.full.height) {
                const fullFilename = `${baseFilename}_full${ext}`;
                variants.full = fullFilename;
                const fullPath = join(this.uploadPath, fullFilename);

                let fullSharp = sharp(file.buffer).resize(
                    this.sizes.full.width,
                    this.sizes.full.height,
                    {
                        fit: 'inside',
                        withoutEnlargement: true,
                    },
                );

                if (format === 'jpeg' || format === 'jpg') {
                    fullSharp = fullSharp.jpeg({ quality: 90, mozjpeg: true });
                } else if (format === 'png') {
                    fullSharp = fullSharp.png({ quality: 90 });
                } else if (format === 'webp') {
                    fullSharp = fullSharp.webp({ quality: 90 });
                } else {
                    fullSharp = fullSharp.jpeg({ quality: 90, mozjpeg: true });
                }

                await fullSharp.toFile(fullPath);
            }
        }

        return {
            variants,
            metadata: {
                width,
                height,
                format,
                size: originalStats.size,
            },
        };
    }

    /**
     * Transform image: resize, crop, rotate, etc.
     */
    async transformImage(
        imageBuffer: Buffer,
        options: {
            width?: number;
            height?: number;
            fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
            quality?: number;
            format?: 'jpeg' | 'png' | 'webp';
            rotate?: number;
            flip?: boolean;
            flop?: boolean;
        } = {},
    ): Promise<Buffer> {
        let sharpInstance = sharp(imageBuffer);

        // Apply transformations
        if (options.width || options.height) {
            sharpInstance = sharpInstance.resize(options.width, options.height, {
                fit: options.fit || 'inside',
                withoutEnlargement: true,
            });
        }

        if (options.rotate) {
            sharpInstance = sharpInstance.rotate(options.rotate);
        }

        if (options.flip) {
            sharpInstance = sharpInstance.flip();
        }

        if (options.flop) {
            sharpInstance = sharpInstance.flop();
        }

        // Convert format and apply quality
        const format = options.format || 'jpeg';
        const quality = options.quality || 85;

        switch (format) {
            case 'jpeg':
                sharpInstance = sharpInstance.jpeg({ quality, mozjpeg: true });
                break;
            case 'png':
                sharpInstance = sharpInstance.png({ quality, compressionLevel: 9 });
                break;
            case 'webp':
                sharpInstance = sharpInstance.webp({ quality });
                break;
        }

        return sharpInstance.toBuffer();
    }

    /**
     * Get image metadata without processing
     */
    async getImageMetadata(imageBuffer: Buffer): Promise<{
        width: number;
        height: number;
        format: string;
        size: number;
        hasAlpha: boolean;
        channels: number;
    }> {
        const metadata = await sharp(imageBuffer).metadata();
        return {
            width: metadata.width || 0,
            height: metadata.height || 0,
            format: metadata.format || 'unknown',
            size: imageBuffer.length,
            hasAlpha: metadata.hasAlpha || false,
            channels: metadata.channels || 0,
        };
    }

    /**
     * Optimize image (compress without resizing)
     */
    async optimizeImage(
        imageBuffer: Buffer,
        quality: number = 85,
    ): Promise<Buffer> {
        const metadata = await sharp(imageBuffer).metadata();
        const format = metadata.format || 'jpeg';

        let sharpInstance = sharp(imageBuffer);

        switch (format) {
            case 'jpeg':
            case 'jpg':
                sharpInstance = sharpInstance.jpeg({ quality, mozjpeg: true });
                break;
            case 'png':
                sharpInstance = sharpInstance.png({ quality, compressionLevel: 9 });
                break;
            case 'webp':
                sharpInstance = sharpInstance.webp({ quality });
                break;
            default:
                // Convert to JPEG for other formats
                sharpInstance = sharpInstance.jpeg({ quality, mozjpeg: true });
        }

        return sharpInstance.toBuffer();
    }
}
