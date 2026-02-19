import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum MediaType {
    IMAGE = 'image',
    VIDEO = 'video',
    DOCUMENT = 'document',
    ALL = 'all',
}

export enum MediaSortBy {
    DATE = 'date',
    SIZE = 'size',
    TYPE = 'type',
}

export enum MediaSortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

export class GetMediaQueryDto {
    @ApiPropertyOptional({
        enum: MediaType,
        default: MediaType.ALL,
        description: 'Filter by media type',
    })
    @IsOptional()
    @IsEnum(MediaType)
    type?: MediaType = MediaType.ALL;

    @ApiPropertyOptional({
        enum: MediaSortBy,
        default: MediaSortBy.DATE,
        description: 'Sort by field',
    })
    @IsOptional()
    @IsEnum(MediaSortBy)
    sortBy?: MediaSortBy = MediaSortBy.DATE;

    @ApiPropertyOptional({
        enum: MediaSortOrder,
        default: MediaSortOrder.DESC,
        description: 'Sort order',
    })
    @IsOptional()
    @IsEnum(MediaSortOrder)
    sortOrder?: MediaSortOrder = MediaSortOrder.DESC;

    @ApiPropertyOptional({
        description: 'Page number',
        default: 1,
        minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Items per page',
        default: 20,
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}
