import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from '../entities/conversation.entity';
import { ConversationParticipant } from '../entities/conversation-participant.entity';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { ConversationParticipantGuard } from './guards/conversation-participant.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, ConversationParticipant, Message, User]),
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService, ConversationParticipantGuard],
  exports: [ConversationsService, ConversationParticipantGuard],
})
export class ConversationsModule {}

