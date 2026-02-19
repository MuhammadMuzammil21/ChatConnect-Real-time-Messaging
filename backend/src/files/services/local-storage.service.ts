import { Injectable } from '@nestjs/common';
import { IStorageProvider, UploadResult } from '../interfaces/storage.interface';
import { storageConfig } from '../config/storage.config';
import { join } from 'path';
import { promises as fs } from 'fs';
import { createReadStream, statSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import type { Readable } from 'stream';

@Injectable()
export class LocalStorageService implements IStorageProvider {
    private readonly uploadPath: string;
    private readonly baseUrl: string;

    constructor() {
        this.uploadPath = join(process.cwd(), storageConfig.local.path);
        this.baseUrl = storageConfig.local.baseUrl;
        this.ensureUploadDirectory();
    }

    private async ensureUploadDirectory(): Promise<void> {
        try {
            await fs.access(this.uploadPath);
        } catch {
            await fs.mkdir(this.uploadPath, { recursive: true });
        }
    }

    async uploadFile(file: Express.Multer.File, userId: string): Promise<UploadResult> {
        const ext = extname(file.originalname);
        const storedFilename = `${uuidv4()}${ext}`;
        const filePath = join(this.uploadPath, storedFilename);

        // Write file to disk
        await fs.writeFile(filePath, file.buffer);

        return {
            storedFilename,
            fileUrl: this.getFileUrl(storedFilename),
            fileSize: file.size,
            mimeType: file.mimetype,
        };
    }

    async deleteFile(storedFilename: string): Promise<void> {
        const filePath = join(this.uploadPath, storedFilename);
        try {
            await fs.unlink(filePath);
        } catch (error) {
            // File might not exist, ignore error
            console.warn(`Failed to delete file ${storedFilename}:`, error.message);
        }
    }

    getFileUrl(storedFilename: string): string {
        return `${this.baseUrl}/${storedFilename}`;
    }

    async getFileStream(storedFilename: string): Promise<Readable> {
        const filePath = join(this.uploadPath, storedFilename);
        return createReadStream(filePath);
    }

    async getFileMetadata(storedFilename: string): Promise<{ size: number; mimeType: string }> {
        const filePath = join(this.uploadPath, storedFilename);
        const stats = statSync(filePath);
        
        // Try to determine MIME type from extension
        const ext = extname(storedFilename).toLowerCase();
        const mimeTypes: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.txt': 'text/plain',
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.mov': 'video/quicktime',
        };

        return {
            size: stats.size,
            mimeType: mimeTypes[ext] || 'application/octet-stream',
        };
    }
}
