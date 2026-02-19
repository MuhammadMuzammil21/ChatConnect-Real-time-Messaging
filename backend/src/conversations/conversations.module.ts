import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from '../entities/conversation.entity';
import { ConversationParticipant } from '../entities/conversation-participant.entity';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { File } from '../entities/file.entity';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { ConversationParticipantGuard } from './guards/conversation-participant.guard';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, ConversationParticipant, Message, User, File]),
    forwardRef(() => FilesModule),
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService, ConversationParticipantGuard],
  exports: [ConversationsService, ConversationParticipantGuard],
})
export class ConversationsModule {}

