import { ApiProperty } from '@nestjs/swagger';
import { FileResponseDto } from '../../files/dto/file-response.dto';

export class MediaResponseDto {
    @ApiProperty({ type: [FileResponseDto] })
    items: FileResponseDto[];

    @ApiProperty()
    total: number;

    @ApiProperty()
    page: number;

    @ApiProperty()
    limit: number;

    @ApiProperty()
    totalPages: number;
}

export class MediaStatisticsDto {
    @ApiProperty()
    totalFiles: number;

    @ApiProperty()
    totalImages: number;

    @ApiProperty()
    totalVideos: number;

    @ApiProperty()
    totalDocuments: number;

    @ApiProperty()
    totalSize: number; // Total size in bytes

    @ApiProperty()
    imagesSize: number;

    @ApiProperty()
    videosSize: number;

    @ApiProperty()
    documentsSize: number;
}
