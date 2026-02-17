import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadFileDto {
    @ApiPropertyOptional({ description: 'Conversation ID to associate file with' })
    @IsOptional()
    @IsUUID()
    conversationId?: string;

    @ApiPropertyOptional({ description: 'Message ID to associate file with' })
    @IsOptional()
    @IsUUID()
    messageId?: string;
}
