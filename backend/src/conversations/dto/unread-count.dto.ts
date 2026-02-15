import { ApiProperty } from '@nestjs/swagger';

export class UnreadCountDto {
  @ApiProperty()
  conversationId: string;

  @ApiProperty()
  unreadCount: number;
}

