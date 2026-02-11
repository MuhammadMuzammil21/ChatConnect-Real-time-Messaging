import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationParticipant } from '../../entities/conversation-participant.entity';

@Injectable()
export class ConversationParticipantGuard implements CanActivate {
  constructor(
    @InjectRepository(ConversationParticipant)
    private readonly participantRepository: Repository<ConversationParticipant>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { id: string } | undefined;
    const conversationId =
      request.params.id || request.params.conversationId || request.body?.conversationId;

    if (!user || !conversationId) {
      throw new ForbiddenException('Access to this conversation is not allowed');
    }

    const participant = await this.participantRepository.findOne({
      where: {
        conversation: { id: conversationId },
        user: { id: user.id },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    return true;
  }
}

