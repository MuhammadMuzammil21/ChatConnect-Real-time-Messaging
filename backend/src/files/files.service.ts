import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from '../entities/file.entity';
import { User, UserRole } from '../entities/user.entity';
import { StorageService } from './services/storage.service';
import { storageConfig, getAllowedMimeTypes } from './config/storage.config';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileResponseDto } from './dto/file-response.dto';

@Injectable()
export class FilesService {
    constructor(
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>,
        private readonly storageService: StorageService,
    ) { }

    async uploadFile(
        file: Express.Multer.File,
        user: User,
        uploadDto?: UploadFileDto,
    ): Promise<FileResponseDto> {
        // Validate file
        this.validateFile(file, user.role);

        // Upload to storage
        const uploadResult = await this.storageService.uploadFile(file, user.id);

        // Save metadata to database
        const fileEntity = this.fileRepository.create({
            filename: file.originalname,
            storedFilename: uploadResult.storedFilename,
            fileUrl: uploadResult.fileUrl,
            mimeType: uploadResult.mimeType,
            fileSize: uploadResult.fileSize,
            uploadedById: user.id,
            conversationId: uploadDto?.conversationId,
            messageId: uploadDto?.messageId,
        });

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
        // TODO: Check if user is participant in conversation
        const files = await this.fileRepository.find({
            where: { conversationId },
            order: { createdAt: 'DESC' },
        });

        return files.map((file) => this.toResponseDto(file));
    }

    private async checkFileAccess(file: File, userId: string): Promise<void> {
        // User can access their own files
        if (file.uploadedById === userId) {
            return;
        }

        // If file is in a conversation, check if user is a participant
        if (file.conversationId) {
            // TODO: Implement conversation participant check
            // For now, allow access
            return;
        }

        throw new ForbiddenException('You do not have access to this file');
    }

    private toResponseDto(file: File): FileResponseDto {
        return {
            id: file.id,
            filename: file.filename,
            fileUrl: file.fileUrl,
            mimeType: file.mimeType,
            fileSize: file.fileSize,
            uploadedById: file.uploadedById,
            conversationId: file.conversationId,
            messageId: file.messageId,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt,
        };
    }
}
