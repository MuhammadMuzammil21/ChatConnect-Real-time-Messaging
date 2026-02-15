import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMessageDto {
    @ApiProperty({
        description: 'Updated message content',
        example: 'This is my edited message',
        maxLength: 2000,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    content: string;
}
