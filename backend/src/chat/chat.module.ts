import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { ChatGateway } from './chat.gateway';
import { JwtWsGuard } from './guards/jwt-ws.guard';

@Module({
  imports: [AuthModule, ConversationsModule, JwtModule.register({})],
  providers: [ChatGateway, JwtWsGuard],
  exports: [ChatGateway],
})
export class ChatModule {}

