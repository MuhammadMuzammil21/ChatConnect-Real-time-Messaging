import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { File } from '../../entities/file.entity';

@Injectable()
export class StorageQuotaService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>,
    ) {}

    /**
     * Get user's storage usage
     */
    async getUserStorageUsage(userId: string): Promise<{
        used: number;
        quota: number;
        available: number;
        percentage: number;
    }> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Calculate actual storage used from files
        const result = await this.fileRepository
            .createQueryBuilder('file')
            .select('COALESCE(SUM(file.fileSize), 0)', 'total')
            .where('file.uploadedById = :userId', { userId })
            .andWhere('file.deletedAt IS NULL')
            .getRawOne();

        const used = parseInt(result?.total || '0', 10);
        const quota = user.storageQuota || 10737418240; // Default 10GB
        const available = Math.max(0, quota - used);
        const percentage = quota > 0 ? (used / quota) * 100 : 0;

        // Update user's storageUsed field
        if (user.storageUsed !== used) {
            user.storageUsed = used;
            await this.userRepository.save(user);
        }

        return {
            used,
            quota,
            available,
            percentage: Math.round(percentage * 100) / 100,
        };
    }

    /**
     * Check if user has enough storage space
     */
    async checkStorageAvailability(
        userId: string,
        fileSize: number,
    ): Promise<boolean> {
        const usage = await this.getUserStorageUsage(userId);
        return usage.available >= fileSize;
    }

    /**
     * Enforce storage quota - throws exception if quota exceeded
     */
    async enforceStorageQuota(userId: string, fileSize: number): Promise<void> {
        const hasSpace = await this.checkStorageAvailability(userId, fileSize);

        if (!hasSpace) {
            const usage = await this.getUserStorageUsage(userId);
            const quotaGB = (usage.quota / (1024 * 1024 * 1024)).toFixed(2);
            const usedGB = (usage.used / (1024 * 1024 * 1024)).toFixed(2);

            throw new BadRequestException(
                `Storage quota exceeded. You have used ${usedGB}GB of ${quotaGB}GB. Please delete some files to free up space.`,
            );
        }
    }

    /**
     * Get storage statistics for a user
     */
    async getUserStorageStatistics(userId: string): Promise<{
        totalFiles: number;
        totalImages: number;
        totalVideos: number;
        totalDocuments: number;
        imagesSize: number;
        videosSize: number;
        documentsSize: number;
        used: number;
        quota: number;
    }> {
        const files = await this.fileRepository.find({
            where: {
                uploadedById: userId,
                deletedAt: null as any,
            },
        });

        let totalFiles = files.length;
        let totalImages = 0;
        let totalVideos = 0;
        let totalDocuments = 0;
        let imagesSize = 0;
        let videosSize = 0;
        let documentsSize = 0;

        for (const file of files) {
            const size = file.fileSize || 0;

            if (file.mimeType.startsWith('image/')) {
                totalImages++;
                imagesSize += size;
            } else if (file.mimeType.startsWith('video/')) {
                totalVideos++;
                videosSize += size;
            } else {
                totalDocuments++;
                documentsSize += size;
            }
        }

        const usage = await this.getUserStorageUsage(userId);

        return {
            totalFiles,
            totalImages,
            totalVideos,
            totalDocuments,
            imagesSize,
            videosSize,
            documentsSize,
            used: usage.used,
            quota: usage.quota,
        };
    }
}
