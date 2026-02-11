import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { ConversationType } from '../../entities/conversation.entity';

export class CreateConversationDto {
  @ApiPropertyOptional({
    enum: ConversationType,
    description: 'Type of conversation. Defaults to DIRECT.',
  })
  @IsOptional()
  @IsEnum(ConversationType)
  type?: ConversationType;

  @ApiPropertyOptional({
    description:
      'Name of the conversation (required for GROUP conversations, ignored for DIRECT).',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiProperty({
    description:
      'List of participant user IDs to include in the conversation (excluding the creator). For DIRECT conversations, must contain exactly one user ID.',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  participantIds?: string[];
}

