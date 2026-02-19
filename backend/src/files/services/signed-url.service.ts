import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface SignedUrlOptions {
    expiresIn?: number; // seconds, default 1 hour
    fileId: string;
    userId: string;
}

@Injectable()
export class SignedUrlService {
    private readonly secretKey: string;
    private readonly defaultExpiration: number = 3600; // 1 hour

    constructor(private readonly configService: ConfigService) {
        // Use JWT secret or generate a dedicated secret for signed URLs
        this.secretKey =
            this.configService.get<string>('SIGNED_URL_SECRET') ||
            this.configService.get<string>('JWT_SECRET') ||
            'default-secret-key-change-in-production';
    }

    /**
     * Generate a signed URL token for file download
     */
    generateSignedToken(options: SignedUrlOptions): string {
        const { fileId, userId, expiresIn = this.defaultExpiration } = options;
        const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

        const payload = {
            fileId,
            userId,
            exp: expiresAt,
        };

        const payloadString = JSON.stringify(payload);
        const signature = crypto
            .createHmac('sha256', this.secretKey)
            .update(payloadString)
            .digest('hex');

        const token = Buffer.from(
            JSON.stringify({ payload, signature }),
        ).toString('base64url');

        return token;
    }

    /**
     * Verify and decode a signed URL token
     */
    verifySignedToken(token: string): {
        fileId: string;
        userId: string;
        expiresAt: number;
    } | null {
        try {
            const decoded = JSON.parse(
                Buffer.from(token, 'base64url').toString('utf-8'),
            );

            const { payload, signature } = decoded;

            // Verify signature
            const expectedSignature = crypto
                .createHmac('sha256', this.secretKey)
                .update(JSON.stringify(payload))
                .digest('hex');

            if (signature !== expectedSignature) {
                return null;
            }

            // Check expiration
            if (payload.exp < Math.floor(Date.now() / 1000)) {
                return null;
            }

            return {
                fileId: payload.fileId,
                userId: payload.userId,
                expiresAt: payload.exp,
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Generate a signed download URL
     */
    generateSignedUrl(
        baseUrl: string,
        options: SignedUrlOptions,
    ): string {
        const token = this.generateSignedToken(options);
        return `${baseUrl}/files/${options.fileId}/download?token=${token}`;
    }
}
