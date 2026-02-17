import { Injectable } from '@nestjs/common';
import { LocalStorageService } from './local-storage.service';
import { IStorageProvider } from '../interfaces/storage.interface';
import { storageConfig } from '../config/storage.config';

@Injectable()
export class StorageService {
    private provider: IStorageProvider;

    constructor(private readonly localStorageService: LocalStorageService) {
        // Select provider based on configuration
        this.provider = this.selectProvider();
    }

    private selectProvider(): IStorageProvider {
        switch (storageConfig.type) {
            case 'local':
                return this.localStorageService;
            // Future: Add S3, Cloudinary providers
            default:
                return this.localStorageService;
        }
    }

    async uploadFile(file: Express.Multer.File, userId: string) {
        return this.provider.uploadFile(file, userId);
    }

    async deleteFile(storedFilename: string) {
        return this.provider.deleteFile(storedFilename);
    }

    getFileUrl(storedFilename: string): string {
        return this.provider.getFileUrl(storedFilename);
    }
}
