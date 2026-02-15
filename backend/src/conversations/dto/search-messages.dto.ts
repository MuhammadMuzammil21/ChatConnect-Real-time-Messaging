import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsInt,
    Min,
    Max,
    IsDateString,
    IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SearchMessagesDto {
    @ApiProperty({
        description: 'Search query string',
        example: 'hello world',
    })
    @IsString()
    @IsNotEmpty()
    query: string;

    @ApiPropertyOptional({
        description: 'Page number for pagination',
        example: 1,
        minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({
        description: 'Number of results per page',
        example: 20,
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;

    @ApiPropertyOptional({
        description: 'Filter messages from this date',
        example: '2026-01-01T00:00:00Z',
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({
        description: 'Filter messages until this date',
        example: '2026-12-31T23:59:59Z',
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({
        description: 'Filter messages by sender ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsOptional()
    @IsUUID()
    senderId?: string;
}
