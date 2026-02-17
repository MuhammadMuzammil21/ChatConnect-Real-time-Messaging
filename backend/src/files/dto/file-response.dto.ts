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

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
