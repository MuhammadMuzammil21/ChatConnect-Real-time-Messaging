import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { MessageType } from '../../entities/message.entity';

export class SendMessageDto {
  @ApiProperty({
    description: 'Message content',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({
    description: 'Type of the message',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType = MessageType.TEXT;
}

