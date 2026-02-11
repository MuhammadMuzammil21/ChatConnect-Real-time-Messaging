import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddParticipantDto {
  @ApiProperty({
    description: 'ID of the user to add as a participant',
  })
  @IsUUID('4')
  userId: string;
}

