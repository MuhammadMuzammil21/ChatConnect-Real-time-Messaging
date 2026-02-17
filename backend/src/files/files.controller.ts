import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Body,
    BadRequestException,
    StreamableFile,
    Res,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiConsumes,
    ApiBody,
    ApiParam,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { FilesService } from './files.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileResponseDto } from './dto/file-response.dto';
import { getAllowedMimeTypes } from './config/storage.config';
import { createReadStream } from 'fs';
import { join } from 'path';

@ApiTags('files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FilesController {
    constructor(private readonly filesService: FilesService) { }

    @Post('upload')
    @ApiOperation({ summary: 'Upload a file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'File to upload (max 10MB for FREE, 50MB for PREMIUM)',
                },
                conversationId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'Optional conversation ID',
                },
                messageId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'Optional message ID',
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
    @ApiResponse({ status: 400, description: 'Invalid file type or size' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
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

        return this.filesService.uploadFile(file, user, uploadDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get file metadata by ID' })
    @ApiParam({ name: 'id', description: 'File ID' })
    @ApiResponse({
        status: 200,
        description: 'File metadata retrieved successfully',
        type: FileResponseDto,
    })
    @ApiResponse({ status: 404, description: 'File not found' })
    @ApiResponse({ status: 403, description: 'Access denied' })
    async getFile(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ): Promise<FileResponseDto> {
        return this.filesService.getFileById(id, user.id);
    }

    @Get(':id/download')
    @ApiOperation({ summary: 'Download file' })
    @ApiParam({ name: 'id', description: 'File ID' })
    @ApiResponse({ status: 200, description: 'File downloaded successfully' })
    @ApiResponse({ status: 404, description: 'File not found' })
    @ApiResponse({ status: 403, description: 'Access denied' })
    async downloadFile(
        @Param('id') id: string,
        @CurrentUser() user: User,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        const fileMetadata = await this.filesService.getFileById(id, user.id);

        // For local storage, stream the file
        // TODO: For S3, redirect to signed URL
        const urlParts = fileMetadata.fileUrl.split('/');
        const storedFilename = urlParts[urlParts.length - 1];
        const filePath = join(
            process.cwd(),
            'uploads',
            'files',
            storedFilename,
        );

        const file = createReadStream(filePath);

        res.set({
            'Content-Type': fileMetadata.mimeType,
            'Content-Disposition': `attachment; filename="${fileMetadata.filename}"`,
        });

        return new StreamableFile(file);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete file' })
    @ApiParam({ name: 'id', description: 'File ID' })
    @ApiResponse({ status: 200, description: 'File deleted successfully' })
    @ApiResponse({ status: 404, description: 'File not found' })
    @ApiResponse({ status: 403, description: 'Only file owner can delete' })
    async deleteFile(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
        await this.filesService.deleteFile(id, user.id);
    }

    @Get('user/my-files')
    @ApiOperation({ summary: 'Get current user files' })
    @ApiResponse({
        status: 200,
        description: 'User files retrieved successfully',
        type: [FileResponseDto],
    })
    async getMyFiles(@CurrentUser() user: User): Promise<FileResponseDto[]> {
        return this.filesService.getUserFiles(user.id);
    }

    @Get('conversation/:conversationId')
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
}
