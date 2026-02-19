import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
    @ApiProperty({ example: 400 })
    statusCode: number;

    @ApiProperty({ example: 'Bad Request' })
    message: string;

    @ApiProperty({ example: 'Validation failed', required: false })
    error?: string;
}

export class FileNotFoundErrorDto extends ErrorResponseDto {
    @ApiProperty({ example: 404 })
    statusCode = 404;

    @ApiProperty({ example: 'File not found' })
    message = 'File not found';
}

export class AccessDeniedErrorDto extends ErrorResponseDto {
    @ApiProperty({ example: 403 })
    statusCode = 403;

    @ApiProperty({ example: 'You do not have access to this file' })
    message = 'You do not have access to this file';
}

export class StorageQuotaExceededErrorDto extends ErrorResponseDto {
    @ApiProperty({ example: 400 })
    statusCode = 400;

    @ApiProperty({
        example: 'Storage quota exceeded. You have used 9.5GB of 10GB. Please delete some files to free up space.',
    })
    message = '';
}

export class RateLimitErrorDto extends ErrorResponseDto {
    @ApiProperty({ example: 429 })
    statusCode = 429;

    @ApiProperty({ example: 'Rate limit exceeded. Try again in 30 seconds.' })
    message = '';

    @ApiProperty({ example: 30, description: 'Seconds to wait before retrying' })
    retryAfter?: number;
}
