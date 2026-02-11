import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Conversation, ConversationType } from '../entities/conversation.entity';
import { ConversationParticipant } from '../entities/conversation-participant.entity';
import { Message, MessageType } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddParticipantDto } from './dto/add-participant.dto';

const MAX_GROUP_PARTICIPANTS = 50;

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationParticipant)
    private readonly participantRepository: Repository<ConversationParticipant>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createConversation(
    creatorId: string,
    dto: CreateConversationDto,
  ): Promise<Conversation> {
    const creator = await this.userRepository.findOne({ where: { id: creatorId } });
    if (!creator) {
      throw new NotFoundException('Creator user not found');
    }

    const type = dto.type ?? ConversationType.DIRECT;

    const otherParticipantIds = dto.participantIds ?? [];
    const allParticipantIds = Array.from(
      new Set([creatorId, ...otherParticipantIds]),
    );

    if (type === ConversationType.DIRECT) {
      if (allParticipantIds.length !== 2) {
        throw new BadRequestException(
          'Direct conversations must have exactly 2 participants',
        );
      }
    } else if (type === ConversationType.GROUP) {
      if (!dto.name || dto.name.trim().length === 0) {
        throw new BadRequestException('Group conversations must have a name');
      }

      if (allParticipantIds.length > MAX_GROUP_PARTICIPANTS) {
        throw new BadRequestException(
          `Group conversations cannot have more than ${MAX_GROUP_PARTICIPANTS} participants`,
        );
      }
    }

    const participants = await this.userRepository.find({
      where: { id: In(allParticipantIds) },
    });

    if (participants.length !== allParticipantIds.length) {
      throw new NotFoundException('One or more participants not found');
    }

    const conversation = this.conversationRepository.create({
      name: dto.name ?? null,
      type,
      createdBy: creator,
    });
    await this.conversationRepository.save(conversation);

    const participantEntities = participants.map((user) =>
      this.participantRepository.create({
        conversation,
        user,
      }),
    );
    await this.participantRepository.save(participantEntities);

    return this.getConversationForUser(conversation.id, creatorId);
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    const participations = await this.participantRepository.find({
      where: { user: { id: userId } },
      relations: [
        'conversation',
        'conversation.createdBy',
        'conversation.participants',
        'conversation.participants.user',
      ],
      order: {
        joinedAt: 'DESC',
      },
    });

    return participations.map((p) => p.conversation);
  }

  async getConversationForUser(
    conversationId: string,
    userId: string,
  ): Promise<Conversation> {
    const participation = await this.participantRepository.findOne({
      where: {
        conversation: { id: conversationId },
        user: { id: userId },
      },
      relations: [
        'conversation',
        'conversation.createdBy',
        'conversation.participants',
        'conversation.participants.user',
        'conversation.messages',
        'conversation.messages.sender',
      ],
    });

    if (!participation) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    return participation.conversation;
  }

  async addParticipant(
    conversationId: string,
    currentUserId: string,
    dto: AddParticipantDto,
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['createdBy'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Only the conversation creator can manage participants
    if (conversation.createdBy.id !== currentUserId) {
      throw new ForbiddenException(
        'Only the conversation creator can add participants',
      );
    }

    if (conversation.type === ConversationType.DIRECT) {
      throw new BadRequestException(
        'Cannot add participants to a direct conversation',
      );
    }

    const userToAdd = await this.userRepository.findOne({
      where: { id: dto.userId },
    });
    if (!userToAdd) {
      throw new NotFoundException('User to add not found');
    }

    const existingParticipant = await this.participantRepository.findOne({
      where: {
        conversation: { id: conversationId },
        user: { id: dto.userId },
      },
    });

    if (existingParticipant) {
      throw new BadRequestException('User is already a participant');
    }

    const currentCount = await this.participantRepository.count({
      where: { conversation: { id: conversationId } },
    });

    if (currentCount + 1 > MAX_GROUP_PARTICIPANTS) {
      throw new BadRequestException(
        `Cannot exceed ${MAX_GROUP_PARTICIPANTS} participants in a group conversation`,
      );
    }

    const participant = this.participantRepository.create({
      conversation,
      user: userToAdd,
    });
    await this.participantRepository.save(participant);

    return this.getConversationForUser(conversationId, currentUserId);
  }

  async removeParticipant(
    conversationId: string,
    currentUserId: string,
    userIdToRemove: string,
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['createdBy'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Only the conversation creator can manage participants
    if (conversation.createdBy.id !== currentUserId) {
      throw new ForbiddenException(
        'Only the conversation creator can remove participants',
      );
    }

    const participant = await this.participantRepository.findOne({
      where: {
        conversation: { id: conversationId },
        user: { id: userIdToRemove },
      },
      relations: ['user'],
    });

    if (!participant) {
      throw new NotFoundException('Participant not found in this conversation');
    }

    // Prevent removing the creator themselves
    if (participant.user.id === conversation.createdBy.id) {
      throw new BadRequestException('Cannot remove the conversation creator');
    }

    await this.participantRepository.remove(participant);

    return this.getConversationForUser(conversationId, currentUserId);
  }

  async assertUserIsParticipant(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: {
        conversation: { id: conversationId },
        user: { id: userId },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }
  }

  async createMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: MessageType = MessageType.TEXT,
  ): Promise<Message> {
    await this.assertUserIsParticipant(conversationId, senderId);

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const sender = await this.userRepository.findOne({ where: { id: senderId } });
    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    const message = this.messageRepository.create({
      content,
      sender,
      conversation,
      messageType,
    });

    return this.messageRepository.save(message);
  }
}

