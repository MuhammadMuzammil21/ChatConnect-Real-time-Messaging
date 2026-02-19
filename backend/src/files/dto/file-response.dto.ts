import { ApiProperty } from '@nestjs/swagger';

export class FileResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    filename: string;

    @ApiProperty()
    fileUrl: string;

    @ApiProperty()
    mimeType: string;

    @ApiProperty()
    fileSize: number;

    @ApiProperty()
    uploadedById: string;

    @ApiProperty({ required: false })
    conversationId?: string;

    @ApiProperty({ required: false })
    messageId?: string;

    @ApiProperty({ required: false })
    thumbnailUrl?: string;

    @ApiProperty({ required: false })
    mediumUrl?: string;

    @ApiProperty({ required: false })
    fullUrl?: string;

    @ApiProperty({ required: false })
    imageWidth?: number;

    @ApiProperty({ required: false })
    imageHeight?: number;

    @ApiProperty({ required: false })
    videoDuration?: number;

    @ApiProperty({ required: false })
    videoThumbnailUrl?: string;

    @ApiProperty({ required: false })
    version?: number;

    @ApiProperty({ required: false })
    parentFileId?: string;

    @ApiProperty({ required: false })
    description?: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
