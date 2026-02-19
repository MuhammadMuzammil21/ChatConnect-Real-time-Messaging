import {
    Controller,
    Post,
    Get,
    Delete,
    Put,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Body,
    BadRequestException,
    StreamableFile,
    Res,
    Query,
    HttpException,
    HttpStatus,
    Req,
    ForbiddenException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiConsumes,
    ApiBody,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response, Request } from 'express';
import type { Readable } from 'stream';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { FilesService } from './files.service';
import { FileUploadRateLimitService } from './services/file-upload-rate-limit.service';
import { SignedUrlService } from './services/signed-url.service';
import { FileSharingService } from './services/file-sharing.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileResponseDto } from './dto/file-response.dto';
import {
    ErrorResponseDto,
    FileNotFoundErrorDto,
    AccessDeniedErrorDto,
    StorageQuotaExceededErrorDto,
    RateLimitErrorDto,
} from './dto/error-response.dto';
import { getAllowedMimeTypes } from './config/storage.config';

@ApiTags('files')
@Controller('files')
export class FilesController {
    constructor(
        private readonly filesService: FilesService,
        private readonly rateLimitService: FileUploadRateLimitService,
        private readonly signedUrlService: SignedUrlService,
        private readonly fileSharingService: FileSharingService,
    ) { }

    @Post('upload')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Upload a file',
        description: 'Upload a file with automatic image processing and compression. Images are automatically optimized and multiple sizes are generated.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'File to upload (max 10MB for FREE, 50MB for PREMIUM). Images are automatically compressed and optimized.',
                },
                conversationId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'Optional conversation ID to associate the file with',
                },
                messageId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'Optional message ID to attach the file to',
                },
            },
            required: ['file'],
        },
    })
    @ApiResponse({
        status: 201,
        description: 'File uploaded successfully',
        type: FileResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid file type, size, or storage quota exceeded',
        type: StorageQuotaExceededErrorDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({
        status: 429,
        description: 'Rate limit exceeded. Too many uploads in a short time.',
        type: RateLimitErrorDto,
    })
    @UseInterceptors(
        FileInterceptor('file', {
            limits: {
                fileSize: 52428800, // 50MB max (will be validated by service based on user role)
            },
            fileFilter: (req, file, cb) => {
                const allowedTypes = getAllowedMimeTypes();
                if (allowedTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(
                        new BadRequestException(
                            `Invalid file type. Allowed types: images, documents, videos`,
                        ),
                        false,
                    );
                }
            },
        }),
    )
    async uploadFile(
        @CurrentUser() user: User,
        @UploadedFile() file: Express.Multer.File,
        @Body() uploadDto: UploadFileDto,
    ): Promise<FileResponseDto> {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        // Check rate limit
        if (!this.rateLimitService.tryAcquire(user.id)) {
            const retryAfter = this.rateLimitService.getRetryAfterSeconds(user.id);
            throw new HttpException(
                {
                    statusCode: HttpStatus.TOO_MANY_REQUESTS,
                    message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
                    retryAfter,
                },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        return this.filesService.uploadFile(file, user, uploadDto);
    }

    @Get('share/:token')
    @ApiOperation({
        summary: 'Access a file via share link',
        description: 'Public endpoint to access files via share token. No authentication required.',
    })
    @ApiParam({ name: 'token', description: 'Share link token' })
    @ApiResponse({ status: 200, description: 'File accessed successfully' })
    @ApiResponse({ status: 404, description: 'Share link not found or expired' })
    async getFileByShareToken(
        @Param('token') token: string,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        const file = await this.fileSharingService.getFileByToken(token);
        const { stream } = await this.filesService.getFileStream(file.id, file.uploadedById);

        res.set({
            'Content-Type': file.mimeType,
            'Content-Disposition': `attachment; filename="${file.filename}"`,
            'Content-Length': file.fileSize.toString(),
        });

        return new StreamableFile(stream as Readable);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get file metadata by ID' })
    @ApiParam({ name: 'id', description: 'File ID' })
    @ApiResponse({
        status: 200,
        description: 'File metadata retrieved successfully',
        type: FileResponseDto,
    })
    @ApiResponse({ status: 404, description: 'File not found', type: FileNotFoundErrorDto })
    @ApiResponse({ status: 403, description: 'Access denied', type: AccessDeniedErrorDto })
    async getFile(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ): Promise<FileResponseDto> {
        return this.filesService.getFileById(id, user.id);
    }

    @Get(':id/download')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Download file with streaming support' })
    @ApiParam({ name: 'id', description: 'File ID' })
    @ApiQuery({ name: 'token', required: false, description: 'Signed URL token (optional)' })
    @ApiResponse({ status: 200, description: 'File downloaded successfully' })
    @ApiResponse({ status: 404, description: 'File not found', type: FileNotFoundErrorDto })
    @ApiResponse({ status: 403, description: 'Access denied', type: AccessDeniedErrorDto })
    async downloadFile(
        @Param('id') id: string,
        @Query('token') token: string | undefined,
        @CurrentUser() user: User,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        // If token is provided, verify it
        if (token) {
            const decoded = this.signedUrlService.verifySignedToken(token);
            if (!decoded || decoded.fileId !== id) {
                throw new ForbiddenException('Invalid or expired download token');
            }
            // Token is valid, use the userId from token
            const { stream, file } = await this.filesService.getFileStream(
                id,
                decoded.userId,
                req.ip,
                req.get('user-agent'),
            );

            res.set({
                'Content-Type': file.mimeType,
                'Content-Disposition': `attachment; filename="${file.filename}"`,
                'Content-Length': file.fileSize.toString(),
            });

            return new StreamableFile(stream as Readable);
        }

        // No token, use authenticated user
        const { stream, file } = await this.filesService.getFileStream(
            id,
            user.id,
            req.ip,
            req.get('user-agent'),
        );

        res.set({
            'Content-Type': file.mimeType,
            'Content-Disposition': `attachment; filename="${file.filename}"`,
            'Content-Length': file.fileSize.toString(),
        });

        return new StreamableFile(stream as Readable);
    }

    @Get(':id/signed-url')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Generate signed URL for secure file download' })
    @ApiParam({ name: 'id', description: 'File ID' })
    @ApiQuery({ name: 'expiresIn', required: false, description: 'Expiration time in seconds (default: 3600)' })
    @ApiResponse({ status: 200, description: 'Signed URL generated successfully' })
    @ApiResponse({ status: 404, description: 'File not found', type: FileNotFoundErrorDto })
    @ApiResponse({ status: 403, description: 'Access denied', type: AccessDeniedErrorDto })
    async generateSignedUrl(
        @Param('id') id: string,
        @Query('expiresIn') expiresIn: string | undefined,
        @CurrentUser() user: User,
    ): Promise<{ signedUrl: string; expiresAt: Date }> {
        // Verify user has access
        await this.filesService.getFileById(id, user.id);

        const expiresInSeconds = expiresIn ? parseInt(expiresIn, 10) : 3600;
        const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        const signedUrl = this.signedUrlService.generateSignedUrl(`${baseUrl}/api/files`, {
            fileId: id,
            userId: user.id,
            expiresIn: expiresInSeconds,
        });

        const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

        return { signedUrl, expiresAt };
    }

    @Get(':id/stats')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get download statistics for a file' })
    @ApiParam({ name: 'id', description: 'File ID' })
    @ApiResponse({ status: 200, description: 'Download statistics retrieved successfully' })
    @ApiResponse({ status: 404, description: 'File not found', type: FileNotFoundErrorDto })
    @ApiResponse({ status: 403, description: 'Access denied', type: AccessDeniedErrorDto })
    async getDownloadStats(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ) {
        return this.filesService.getDownloadStats(id, user.id);
    }

    @Put(':id/rename')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Rename a file' })
    @ApiParam({ name: 'id', description: 'File ID' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                filename: {
                    type: 'string',
                    description: 'New filename',
                    example: 'my-document.pdf',
                },
            },
            required: ['filename'],
        },
    })
    @ApiResponse({ status: 200, description: 'File renamed successfully', type: FileResponseDto })
    @ApiResponse({ status: 404, description: 'File not found', type: FileNotFoundErrorDto })
    @ApiResponse({ status: 403, description: 'Access denied', type: AccessDeniedErrorDto })
    async renameFile(
        @Param('id') id: string,
        @Body() body: { filename: string },
        @CurrentUser() user: User,
    ): Promise<FileResponseDto> {
        return this.filesService.renameFile(id, user.id, body.filename);
    }

    @Put(':id/description')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Update file description/metadata' })
    @ApiParam({ name: 'id', description: 'File ID' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                description: {
                    type: 'string',
                    description: 'File description',
                    example: 'Project documentation',
                },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Description updated successfully', type: FileResponseDto })
    async updateDescription(
        @Param('id') id: string,
        @Body() body: { description?: string },
        @CurrentUser() user: User,
    ): Promise<FileResponseDto> {
        return this.filesService.updateFileDescription(id, user.id, body.description || '');
    }

    @Post(':id/versions')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Create a new version of a file' })
    @ApiConsumes('multipart/form-data')
    @ApiParam({ name: 'id', description: 'Original file ID' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'New version of the file',
                },
            },
            required: ['file'],
        },
    })
    @ApiResponse({ status: 201, description: 'File version created successfully', type: FileResponseDto })
    @UseInterceptors(FileInterceptor('file'))
    async createFileVersion(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: User,
    ): Promise<FileResponseDto> {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        return this.filesService.createFileVersion(id, file, user);
    }

    @Get(':id/versions')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get all versions of a file' })
    @ApiParam({ name: 'id', description: 'File ID' })
    @ApiResponse({ status: 200, description: 'File versions retrieved successfully', type: [FileResponseDto] })
    async getFileVersions(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ): Promise<FileResponseDto[]> {
        return this.filesService.getFileVersions(id, user.id);
    }

    @Post(':id/share')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Create a share link for a file' })
    @ApiParam({ name: 'id', description: 'File ID' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                expiresIn: {
                    type: 'number',
                    description: 'Expiration time in seconds (null for no expiration)',
                    example: 3600,
                },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'Share link created successfully' })
    async createShareLink(
        @Param('id') id: string,
        @Body() body: { expiresIn?: number },
        @CurrentUser() user: User,
    ) {
        return this.fileSharingService.createShareLink({
            fileId: id,
            userId: user.id,
            expiresIn: body.expiresIn,
        });
    }

    @Get(':id/share-links')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get all share links for a file' })
    @ApiParam({ name: 'id', description: 'File ID' })
    @ApiResponse({ status: 200, description: 'Share links retrieved successfully' })
    async getShareLinks(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ) {
        return this.fileSharingService.getFileShareLinks(id, user.id);
    }

    @Delete('share-links/:linkId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Revoke a share link' })
    @ApiParam({ name: 'linkId', description: 'Share link ID' })
    @ApiResponse({ status: 200, description: 'Share link revoked successfully' })
    async revokeShareLink(
        @Param('linkId') linkId: string,
        @CurrentUser() user: User,
    ): Promise<{ success: boolean }> {
        await this.fileSharingService.revokeShareLink(linkId, user.id);
        return { success: true };
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Delete file' })
    @ApiParam({ name: 'id', description: 'File ID' })
    @ApiResponse({ status: 200, description: 'File deleted successfully' })
    @ApiResponse({ status: 404, description: 'File not found' })
    @ApiResponse({ status: 403, description: 'Only file owner can delete' })
    async deleteFile(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
        await this.filesService.deleteFile(id, user.id);
    }

    @Get('user/my-files')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get current user files' })
    @ApiResponse({
        status: 200,
        description: 'User files retrieved successfully',
        type: [FileResponseDto],
    })
    async getMyFiles(@CurrentUser() user: User): Promise<FileResponseDto[]> {
        return this.filesService.getUserFiles(user.id);
    }

    @Get('user/statistics')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get file usage statistics for current user' })
    @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
    async getUserStatistics(@CurrentUser() user: User) {
        return this.filesService.getUserFileStatistics(user.id);
    }

    @Get('conversation/:conversationId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get files for a conversation' })
    @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
    @ApiResponse({
        status: 200,
        description: 'Conversation files retrieved successfully',
        type: [FileResponseDto],
    })
    async getConversationFiles(
        @Param('conversationId') conversationId: string,
        @CurrentUser() user: User,
    ): Promise<FileResponseDto[]> {
        return this.filesService.getConversationFiles(conversationId, user.id);
    }

    @Post(':id/transform')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Transform an image (resize, crop, rotate, etc.)' })
    @ApiParam({ name: 'id', description: 'File ID' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                width: { type: 'number', description: 'Target width' },
                height: { type: 'number', description: 'Target height' },
                fit: {
                    type: 'string',
                    enum: ['cover', 'contain', 'fill', 'inside', 'outside'],
                    description: 'How to fit the image',
                },
                quality: { type: 'number', minimum: 1, maximum: 100, description: 'Image quality (1-100)' },
                format: { type: 'string', enum: ['jpeg', 'png', 'webp'], description: 'Output format' },
                rotate: { type: 'number', description: 'Rotation angle in degrees' },
                flip: { type: 'boolean', description: 'Flip vertically' },
                flop: { type: 'boolean', description: 'Flip horizontally' },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Image transformed successfully' })
    @ApiResponse({ status: 404, description: 'File not found' })
    @ApiResponse({ status: 400, description: 'File is not an image' })
    async transformImage(
        @Param('id') id: string,
        @Body() transformOptions: {
            width?: number;
            height?: number;
            fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
            quality?: number;
            format?: 'jpeg' | 'png' | 'webp';
            rotate?: number;
            flip?: boolean;
            flop?: boolean;
        },
        @CurrentUser() user: User,
        @Res() res: Response,
    ): Promise<void> {
        const file = await this.filesService.getFileById(id, user.id);

        if (!this.filesService['imageProcessingService'].isImage(file.mimeType)) {
            throw new BadRequestException('File is not an image');
        }

        // Get file buffer
        const fileStream = await this.filesService.getFileStream(id, user.id);
        const chunks: Buffer[] = [];
        for await (const chunk of fileStream.stream) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        const imageBuffer = Buffer.concat(chunks);

        // Transform image
        const transformedBuffer = await this.filesService['imageProcessingService'].transformImage(
            imageBuffer,
            transformOptions,
        );

        // Determine content type
        const format = transformOptions.format || 'jpeg';
        const contentType = `image/${format}`;

        res.set({
            'Content-Type': contentType,
            'Content-Length': transformedBuffer.length.toString(),
        });

        res.send(transformedBuffer);
    }
}
