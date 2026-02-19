import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from '../entities/file.entity';
import { FileDownload } from '../entities/file-download.entity';
import { ConversationParticipant } from '../entities/conversation-participant.entity';
import { User, UserRole } from '../entities/user.entity';
import { StorageService } from './services/storage.service';
import { SignedUrlService } from './services/signed-url.service';
import { ImageProcessingService } from './services/image-processing.service';
import { VideoProcessingService } from './services/video-processing.service';
import { StorageQuotaService } from './services/storage-quota.service';
import { storageConfig, getAllowedMimeTypes } from './config/storage.config';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileResponseDto } from './dto/file-response.dto';
import { join } from 'path';
import type { Readable } from 'stream';

@Injectable()
export class FilesService {
    private readonly logger = new Logger(FilesService.name);

    constructor(
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>,
        @InjectRepository(FileDownload)
        private readonly fileDownloadRepository: Repository<FileDownload>,
        @InjectRepository(ConversationParticipant)
        private readonly participantRepository: Repository<ConversationParticipant>,
        private readonly storageService: StorageService,
        private readonly signedUrlService: SignedUrlService,
        private readonly imageProcessingService: ImageProcessingService,
        private readonly videoProcessingService?: VideoProcessingService,
        private readonly storageQuotaService?: StorageQuotaService,
    ) { }

    async uploadFile(
        file: Express.Multer.File,
        user: User,
        uploadDto?: UploadFileDto,
    ): Promise<FileResponseDto> {
        // Validate file
        this.validateFile(file, user.role);

        // Check storage quota
        if (this.storageQuotaService) {
            await this.storageQuotaService.enforceStorageQuota(user.id, file.size);
        }

        let fileEntityData: Partial<File> = {
            filename: file.originalname,
            mimeType: file.mimetype,
            uploadedById: user.id,
            conversationId: uploadDto?.conversationId,
            messageId: uploadDto?.messageId,
        };

        // Process images: compress, generate variants, remove EXIF
        if (this.imageProcessingService.isImage(file.mimetype)) {
            const processed = await this.imageProcessingService.processImage(
                file,
                user.id,
                true, // Generate variants
            );

            // Use processed original as stored file
            const baseUrl = storageConfig.local.baseUrl;
            fileEntityData.storedFilename = processed.variants.original;
            fileEntityData.fileUrl = `${baseUrl}/${processed.variants.original}`;
            fileEntityData.fileSize = processed.metadata.size;
            fileEntityData.imageWidth = processed.metadata.width;
            fileEntityData.imageHeight = processed.metadata.height;

            // Add variant URLs
            if (processed.variants.thumbnail) {
                fileEntityData.thumbnailUrl = `${baseUrl}/${processed.variants.thumbnail}`;
            }
            if (processed.variants.medium) {
                fileEntityData.mediumUrl = `${baseUrl}/${processed.variants.medium}`;
            }
            if (processed.variants.full) {
                fileEntityData.fullUrl = `${baseUrl}/${processed.variants.full}`;
            }
        } else if (
            this.videoProcessingService &&
            this.videoProcessingService.isVideo(file.mimetype)
        ) {
            // Process videos: generate thumbnail and extract metadata
            const uploadResult = await this.storageService.uploadFile(file, user.id);
            const filePath = join(
                process.cwd(),
                storageConfig.local.path,
                uploadResult.storedFilename,
            );

            try {
                const processed = await this.videoProcessingService.processVideo(
                    filePath,
                    file.originalname,
                    true, // Generate thumbnail
                    false, // Don't compress by default (can be enabled for large files)
                );

                fileEntityData.storedFilename = uploadResult.storedFilename;
                fileEntityData.fileUrl = uploadResult.fileUrl;
                fileEntityData.fileSize = uploadResult.fileSize;
                fileEntityData.videoDuration = Math.round(processed.metadata.duration);
                fileEntityData.videoThumbnailUrl = processed.thumbnailUrl;
            } catch (error) {
                // If video processing fails, still save the file
                this.logger.warn(`Video processing failed: ${error.message}`);
                fileEntityData.storedFilename = uploadResult.storedFilename;
                fileEntityData.fileUrl = uploadResult.fileUrl;
                fileEntityData.fileSize = uploadResult.fileSize;
            }
        } else {
            // Non-image/video files: upload as-is
            const uploadResult = await this.storageService.uploadFile(file, user.id);
            fileEntityData.storedFilename = uploadResult.storedFilename;
            fileEntityData.fileUrl = uploadResult.fileUrl;
            fileEntityData.fileSize = uploadResult.fileSize;
        }

        // Save metadata to database
        const fileEntity = this.fileRepository.create(fileEntityData);
        const savedFile = await this.fileRepository.save(fileEntity);

        return this.toResponseDto(savedFile);
    }

    validateFile(file: Express.Multer.File, userRole: UserRole): void {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        // Check MIME type
        const allowedTypes = getAllowedMimeTypes();
        if (!allowedTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
            );
        }

        // Check file size based on user role
        const maxSize =
            userRole === UserRole.PREMIUM
                ? storageConfig.limits.premium
                : storageConfig.limits.free;

        if (file.size > maxSize) {
            const maxSizeMB = Math.round(maxSize / (1024 * 1024));
            throw new BadRequestException(
                `File size exceeds ${maxSizeMB}MB limit for ${userRole} users`,
            );
        }
    }

    async getFileById(id: string, userId: string): Promise<FileResponseDto> {
        const file = await this.fileRepository.findOne({
            where: { id },
            relations: ['uploadedBy', 'conversation'],
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        // Check if user has access to this file
        await this.checkFileAccess(file, userId);

        return this.toResponseDto(file);
    }

    /**
     * Get file stream for download with proper authorization
     */
    async getFileStream(
        id: string,
        userId: string,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<{ stream: Readable; file: File }> {
        const file = await this.fileRepository.findOne({
            where: { id },
            relations: ['conversation'],
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        // Check if user has access to this file
        await this.checkFileAccess(file, userId);

        // Track download
        await this.trackDownload(file.id, userId, ipAddress, userAgent);

        // Get file stream from storage
        const stream = await this.storageService.getFileStream(file.storedFilename);

        return { stream, file };
    }

    /**
     * Generate a signed URL for secure file download
     */
    generateSignedDownloadUrl(fileId: string, userId: string): string {
        const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        return this.signedUrlService.generateSignedUrl(`${baseUrl}/api`, {
            fileId,
            userId,
            expiresIn: 3600, // 1 hour
        });
    }

    /**
     * Track file download for analytics
     */
    private async trackDownload(
        fileId: string,
        userId: string,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<void> {
        const download = this.fileDownloadRepository.create({
            fileId,
            userId,
            ipAddress,
            userAgent,
        });
        await this.fileDownloadRepository.save(download);
    }

    /**
     * Get download statistics for a file
     */
    async getDownloadStats(fileId: string, userId: string): Promise<{
        totalDownloads: number;
        uniqueUsers: number;
        recentDownloads: FileDownload[];
    }> {
        const file = await this.fileRepository.findOne({
            where: { id: fileId },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        // Check access
        await this.checkFileAccess(file, userId);

        const totalDownloads = await this.fileDownloadRepository.count({
            where: { fileId },
        });

        const uniqueUsers = await this.fileDownloadRepository
            .createQueryBuilder('download')
            .select('COUNT(DISTINCT download.userId)', 'count')
            .where('download.fileId = :fileId', { fileId })
            .getRawOne();

        const recentDownloads = await this.fileDownloadRepository.find({
            where: { fileId },
            relations: ['downloadedBy'],
            order: { downloadedAt: 'DESC' },
            take: 10,
        });

        return {
            totalDownloads,
            uniqueUsers: parseInt(uniqueUsers?.count || '0', 10),
            recentDownloads,
        };
    }

    async deleteFile(id: string, userId: string): Promise<void> {
        const file = await this.fileRepository.findOne({
            where: { id },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        // Only the uploader can delete the file
        if (file.uploadedById !== userId) {
            throw new ForbiddenException('You can only delete your own files');
        }

        // Delete from storage
        await this.storageService.deleteFile(file.storedFilename);

        // Soft delete from database
        await this.fileRepository.softDelete(id);
    }

    async getUserFiles(userId: string, limit: number = 50): Promise<FileResponseDto[]> {
        const files = await this.fileRepository.find({
            where: { uploadedById: userId },
            order: { createdAt: 'DESC' },
            take: limit,
        });

        return files.map((file) => this.toResponseDto(file));
    }

    async getConversationFiles(
        conversationId: string,
        userId: string,
    ): Promise<FileResponseDto[]> {
        // Check if user is participant in conversation
        const participant = await this.participantRepository.findOne({
            where: {
                conversation: { id: conversationId },
                user: { id: userId },
            },
        });

        if (!participant) {
            throw new ForbiddenException(
                'You are not a participant in this conversation',
            );
        }

        const files = await this.fileRepository.find({
            where: { conversationId },
            order: { createdAt: 'DESC' },
        });

        return files.map((file) => this.toResponseDto(file));
    }

    /**
     * Check if user has access to a file
     * - User can access their own files
     * - User can access files in conversations they participate in
     */
    private async checkFileAccess(file: File, userId: string): Promise<void> {
        // User can access their own files
        if (file.uploadedById === userId) {
            return;
        }

        // If file is in a conversation, check if user is a participant
        if (file.conversationId) {
            const participant = await this.participantRepository.findOne({
                where: {
                    conversation: { id: file.conversationId },
                    user: { id: userId },
                },
            });

            if (participant) {
                return;
            }
        }

        // If file is attached to a message, check conversation access
        if (file.messageId) {
            const fileWithMessage = await this.fileRepository.findOne({
                where: { id: file.id },
                relations: ['message', 'message.conversation'],
            });

            if (fileWithMessage?.message?.conversation) {
                const participant = await this.participantRepository.findOne({
                    where: {
                        conversation: { id: fileWithMessage.message.conversation.id },
                        user: { id: userId },
                    },
                });

                if (participant) {
                    return;
                }
            }
        }

        throw new ForbiddenException('You do not have access to this file');
    }

    /**
     * Delete files associated with a message when message is deleted
     */
    async deleteFilesByMessageId(messageId: string): Promise<void> {
        const files = await this.fileRepository.find({
            where: { messageId },
        });

        for (const file of files) {
            // Delete from storage
            await this.storageService.deleteFile(file.storedFilename);
            // Soft delete from database
            await this.fileRepository.softDelete(file.id);
        }
    }

    /**
     * Rename a file
     */
    async renameFile(
        fileId: string,
        userId: string,
        newFilename: string,
    ): Promise<FileResponseDto> {
        const file = await this.fileRepository.findOne({
            where: { id: fileId },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        if (file.uploadedById !== userId) {
            throw new ForbiddenException('You can only rename your own files');
        }

        // Validate filename
        if (!newFilename || newFilename.trim().length === 0) {
            throw new BadRequestException('Filename cannot be empty');
        }

        if (newFilename.length > 255) {
            throw new BadRequestException('Filename too long (max 255 characters)');
        }

        file.filename = newFilename.trim();
        const updated = await this.fileRepository.save(file);

        return this.toResponseDto(updated);
    }

    /**
     * Update file description/metadata
     */
    async updateFileDescription(
        fileId: string,
        userId: string,
        description: string,
    ): Promise<FileResponseDto> {
        const file = await this.fileRepository.findOne({
            where: { id: fileId },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        if (file.uploadedById !== userId) {
            throw new ForbiddenException('You can only update your own files');
        }

        file.description = description?.trim() || null;
        const updated = await this.fileRepository.save(file);

        return this.toResponseDto(updated);
    }

    /**
     * Create a new version of a file
     */
    async createFileVersion(
        fileId: string,
        newFile: Express.Multer.File,
        user: User,
    ): Promise<FileResponseDto> {
        const originalFile = await this.fileRepository.findOne({
            where: { id: fileId },
        });

        if (!originalFile) {
            throw new NotFoundException('Original file not found');
        }

        if (originalFile.uploadedById !== user.id) {
            throw new ForbiddenException('You can only create versions of your own files');
        }

        // Check storage quota
        if (this.storageQuotaService) {
            await this.storageQuotaService.enforceStorageQuota(user.id, newFile.size);
        }

        // Get next version number
        const maxVersion = await this.fileRepository
            .createQueryBuilder('file')
            .where('file.parentFileId = :parentId', { parentId: fileId })
            .orWhere('file.id = :fileId', { fileId })
            .select('MAX(file.version)', 'max')
            .getRawOne();

        const nextVersion = (maxVersion?.max || originalFile.version || 0) + 1;

        // Upload new file
        const uploadResult = await this.storageService.uploadFile(newFile, user.id);

        // Create version record
        const versionFile = this.fileRepository.create({
            filename: newFile.originalname,
            storedFilename: uploadResult.storedFilename,
            fileUrl: uploadResult.fileUrl,
            mimeType: uploadResult.mimeType,
            fileSize: uploadResult.fileSize,
            uploadedById: user.id,
            conversationId: originalFile.conversationId,
            parentFileId: originalFile.parentFileId || originalFile.id,
            version: nextVersion,
        });

        const saved = await this.fileRepository.save(versionFile);

        return this.toResponseDto(saved);
    }

    /**
     * Get file versions
     */
    async getFileVersions(fileId: string, userId: string): Promise<FileResponseDto[]> {
        const file = await this.fileRepository.findOne({
            where: { id: fileId },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        // Check access
        await this.checkFileAccess(file, userId);

        const parentFileId = file.parentFileId || file.id;

        const versions = await this.fileRepository.find({
            where: [
                { id: parentFileId },
                { parentFileId },
            ],
            order: { version: 'ASC' },
        });

        return versions.map((f) => this.toResponseDto(f));
    }

    /**
     * Get user file usage statistics
     */
    async getUserFileStatistics(userId: string) {
        if (!this.storageQuotaService) {
            throw new BadRequestException('Storage quota service not available');
        }

        return this.storageQuotaService.getUserStorageStatistics(userId);
    }

    toResponseDto(file: File): FileResponseDto {
        return {
            id: file.id,
            filename: file.filename,
            fileUrl: file.fileUrl,
            mimeType: file.mimeType,
            fileSize: file.fileSize,
            uploadedById: file.uploadedById,
            conversationId: file.conversationId,
            messageId: file.messageId,
            thumbnailUrl: file.thumbnailUrl,
            mediumUrl: file.mediumUrl,
            fullUrl: file.fullUrl,
            imageWidth: file.imageWidth,
            imageHeight: file.imageHeight,
            videoDuration: file.videoDuration,
            videoThumbnailUrl: file.videoThumbnailUrl,
            version: file.version,
            parentFileId: file.parentFileId,
            description: file.description ?? undefined,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt,
        };
    }
}
