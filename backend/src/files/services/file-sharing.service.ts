import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileShareLink } from '../../entities/file-share-link.entity';
import { File } from '../../entities/file.entity';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface CreateShareLinkDto {
    fileId: string;
    expiresIn?: number; // seconds, null for no expiration
    userId: string;
}

export interface ShareLinkResponse {
    id: string;
    token: string;
    shareUrl: string;
    expiresAt: Date | null;
    accessCount: number;
    createdAt: Date;
}

@Injectable()
export class FileSharingService {
    private readonly baseUrl: string;

    constructor(
        @InjectRepository(FileShareLink)
        private readonly shareLinkRepository: Repository<FileShareLink>,
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>,
        private readonly configService: ConfigService,
    ) {
        this.baseUrl =
            this.configService.get<string>('API_BASE_URL') ||
            'http://localhost:3000';
    }

    /**
     * Generate a unique token for share link
     */
    private generateToken(): string {
        return crypto.randomBytes(32).toString('base64url');
    }

    /**
     * Create a share link for a file
     */
    async createShareLink(dto: CreateShareLinkDto): Promise<ShareLinkResponse> {
        const file = await this.fileRepository.findOne({
            where: { id: dto.fileId },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        // Check if user owns the file
        if (file.uploadedById !== dto.userId) {
            throw new BadRequestException('You can only create share links for your own files');
        }

        const expiresAt = dto.expiresIn
            ? new Date(Date.now() + dto.expiresIn * 1000)
            : null;

        const token = this.generateToken();

        const shareLink = this.shareLinkRepository.create({
            fileId: dto.fileId,
            createdById: dto.userId,
            token,
            expiresAt,
            isActive: true,
        });

        const saved = await this.shareLinkRepository.save(shareLink);

        return {
            id: saved.id,
            token: saved.token,
            shareUrl: `${this.baseUrl}/api/files/share/${saved.token}`,
            expiresAt: saved.expiresAt,
            accessCount: saved.accessCount,
            createdAt: saved.createdAt,
        };
    }

    /**
     * Get file by share token
     */
    async getFileByToken(token: string): Promise<File> {
        const shareLink = await this.shareLinkRepository.findOne({
            where: { token },
            relations: ['file'],
        });

        if (!shareLink) {
            throw new NotFoundException('Share link not found');
        }

        if (!shareLink.isActive) {
            throw new BadRequestException('Share link is inactive');
        }

        if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
            throw new BadRequestException('Share link has expired');
        }

        // Update access count
        shareLink.accessCount += 1;
        shareLink.lastAccessedAt = new Date();
        await this.shareLinkRepository.save(shareLink);

        return shareLink.file;
    }

    /**
     * Get all share links for a file
     */
    async getFileShareLinks(fileId: string, userId: string): Promise<ShareLinkResponse[]> {
        const file = await this.fileRepository.findOne({
            where: { id: fileId },
        });

        if (!file || file.uploadedById !== userId) {
            throw new NotFoundException('File not found or access denied');
        }

        const shareLinks = await this.shareLinkRepository.find({
            where: { fileId },
            order: { createdAt: 'DESC' },
        });

        return shareLinks.map((link) => ({
            id: link.id,
            token: link.token,
            shareUrl: `${this.baseUrl}/api/files/share/${link.token}`,
            expiresAt: link.expiresAt,
            accessCount: link.accessCount,
            createdAt: link.createdAt,
        }));
    }

    /**
     * Revoke a share link
     */
    async revokeShareLink(linkId: string, userId: string): Promise<void> {
        const shareLink = await this.shareLinkRepository.findOne({
            where: { id: linkId },
            relations: ['file'],
        });

        if (!shareLink) {
            throw new NotFoundException('Share link not found');
        }

        if (shareLink.file.uploadedById !== userId) {
            throw new BadRequestException('You can only revoke your own share links');
        }

        shareLink.isActive = false;
        await this.shareLinkRepository.save(shareLink);
    }

    /**
     * Delete expired share links (cleanup job)
     */
    async cleanupExpiredLinks(): Promise<number> {
        const result = await this.shareLinkRepository
            .createQueryBuilder()
            .delete()
            .where('expiresAt IS NOT NULL')
            .andWhere('expiresAt < :now', { now: new Date() })
            .execute();

        return result.affected || 0;
    }
}
