import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { UserStatusModule } from '../user-status/user-status.module';
import { ChatGateway } from './chat.gateway';
import { JwtWsGuard } from './guards/jwt-ws.guard';
import { MessageRateLimitService } from './message-rate-limit.service';

@Module({
  imports: [
    AuthModule,
    ConversationsModule,
    UserStatusModule,
    JwtModule.register({}),
  ],
  providers: [ChatGateway, JwtWsGuard, MessageRateLimitService],
  exports: [ChatGateway],
})
export class ChatModule {}

