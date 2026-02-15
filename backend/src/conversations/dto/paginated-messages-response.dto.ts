import { ApiProperty } from '@nestjs/swagger';
import { Message } from '../../entities/message.entity';

export class PaginatedMessagesResponseDto {
  @ApiProperty({ type: [Message] })
  items: Message[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

