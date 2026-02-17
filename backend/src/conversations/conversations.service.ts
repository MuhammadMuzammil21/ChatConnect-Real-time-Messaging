import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, MoreThan, Repository, IsNull, Between, Like, ILike } from 'typeorm';
import { Conversation, ConversationType } from '../entities/conversation.entity';
import { ConversationParticipant } from '../entities/conversation-participant.entity';
import { Message, MessageType } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { SearchMessagesDto } from './dto/search-messages.dto';

const MAX_GROUP_PARTICIPANTS = 50;
const MAX_MESSAGE_LENGTH = 2000;
const MESSAGE_EDIT_TIME_LIMIT_MS = 15 * 60 * 1000; // 15 minutes
const MESSAGE_DELETE_TIME_LIMIT_MS = 60 * 60 * 1000; // 1 hour

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
  ) { }

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
    fileIds?: string[],
  ): Promise<Message> {
    const trimmedContent = (content ?? '').trim();

    // Allow empty content if there are file attachments
    if (!trimmedContent && (!fileIds || fileIds.length === 0)) {
      throw new BadRequestException('Message must have content or file attachments');
    }

    if (trimmedContent && trimmedContent.length > MAX_MESSAGE_LENGTH) {
      throw new BadRequestException(
        `Message content cannot exceed ${MAX_MESSAGE_LENGTH} characters`,
      );
    }

    if (!Object.values(MessageType).includes(messageType)) {
      throw new BadRequestException('Invalid message type');
    }

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
      content: trimmedContent,
      sender,
      conversation,
      messageType,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Associate files with the message if fileIds provided
    if (fileIds && fileIds.length > 0) {
      // Import File entity
      const { File } = await import('../entities/file.entity.js');
      const fileRepository = this.messageRepository.manager.getRepository(File);

      // Update files to associate with this message
      await fileRepository.update(
        { id: In(fileIds), uploadedBy: { id: senderId } },
        { message: savedMessage },
      );

      // Reload message with attachments
      const reloadedMessage = await this.messageRepository.findOne({
        where: { id: savedMessage.id },
        relations: ['sender', 'attachments'],
      });

      if (!reloadedMessage) {
        throw new NotFoundException('Failed to reload message with attachments');
      }

      return reloadedMessage;
    }

    return savedMessage;
  }

  async getMessageHistory(
    conversationId: string,
    userId: string,
    query: GetMessagesQueryDto,
  ): Promise<{
    items: Message[];
    total: number;
    page: number;
    limit: number;
  }> {
    await this.assertUserIsParticipant(conversationId, userId);

    const page = query.page && query.page > 0 ? query.page : 1;
    const requestedLimit = query.limit && query.limit > 0 ? query.limit : 50;
    const limit = Math.min(requestedLimit, 100);

    const [items, total] = await this.messageRepository.findAndCount({
      where: {
        conversation: { id: conversationId },
      },
      relations: ['sender'],
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * Get unread counts for all conversations the user participates in.
   */
  async getAllUnreadCountsForUser(
    userId: string,
  ): Promise<{ conversationId: string; unreadCount: number }[]> {
    const participations = await this.participantRepository.find({
      where: { user: { id: userId } },
      relations: ['conversation'],
    });
    const results: { conversationId: string; unreadCount: number }[] = [];
    for (const p of participations) {
      const count = await this.getUnreadCountForConversation(
        p.conversation.id,
        userId,
      );
      results.push({ conversationId: p.conversation.id, unreadCount: count });
    }
    return results;
  }

  async getUnreadCountForConversation(
    conversationId: string,
    userId: string,
  ): Promise<number> {
    const participant = await this.participantRepository.findOne({
      where: {
        conversation: { id: conversationId },
        user: { id: userId },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const since: Date | null = participant.lastReadAt ?? participant.joinedAt;

    const where: FindOptionsWhere<Message> = {
      conversation: { id: conversationId },
    };

    if (since) {
      where.createdAt = MoreThan(since);
    }

    const unreadCount = await this.messageRepository.count({
      where,
    });

    return unreadCount;
  }

  async markConversationAsRead(
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

    participant.lastReadAt = new Date();
    await this.participantRepository.save(participant);
  }

  /**
   * Get all participant user IDs for a conversation (for real-time unread updates).
   */
  async getConversationParticipantUserIds(
    conversationId: string,
  ): Promise<string[]> {
    const participants = await this.participantRepository.find({
      where: { conversation: { id: conversationId } },
      relations: ['user'],
    });
    return participants.map((p) => p.user.id);
  }

  /**
   * Sanitize message content to prevent XSS attacks
   */
  private sanitizeContent(content: string): string {
    // Strip HTML tags
    let sanitized = content.replace(/<[^>]*>/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Escape special characters for safety
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    return sanitized;
  }

  /**
   * Edit an existing message
   */
  async editMessage(
    messageId: string,
    userId: string,
    dto: UpdateMessageDto,
  ): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'conversation'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is the sender
    if (message.sender.id !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    // Check if message is deleted
    if (message.deletedAt) {
      throw new BadRequestException('Cannot edit a deleted message');
    }

    // Check edit time limit (15 minutes)
    const messageAge = Date.now() - message.createdAt.getTime();
    if (messageAge > MESSAGE_EDIT_TIME_LIMIT_MS) {
      throw new BadRequestException(
        'Messages can only be edited within 15 minutes of sending',
      );
    }

    // Sanitize and validate content
    const sanitizedContent = this.sanitizeContent(dto.content);
    if (!sanitizedContent || sanitizedContent.length === 0) {
      throw new BadRequestException('Message content cannot be empty');
    }

    if (sanitizedContent.length > MAX_MESSAGE_LENGTH) {
      throw new BadRequestException(
        `Message content cannot exceed ${MAX_MESSAGE_LENGTH} characters`,
      );
    }

    // Update message
    message.content = sanitizedContent;
    message.isEdited = true;
    message.editedAt = new Date();

    return this.messageRepository.save(message);
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(
    messageId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is the sender
    if (message.sender.id !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    // Check if already deleted
    if (message.deletedAt) {
      throw new BadRequestException('Message is already deleted');
    }

    // Get the user for deletedBy relation
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete the message
    message.deletedAt = new Date();
    message.deletedBy = user;
    await this.messageRepository.save(message);

    return { success: true };
  }

  /**
   * Search messages in a conversation
   */
  async searchMessages(
    conversationId: string,
    userId: string,
    dto: SearchMessagesDto,
  ): Promise<{
    items: Message[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Verify user is participant
    await this.assertUserIsParticipant(conversationId, userId);

    const page = dto.page && dto.page > 0 ? dto.page : 1;
    const requestedLimit = dto.limit && dto.limit > 0 ? dto.limit : 20;
    const limit = Math.min(requestedLimit, 100);

    // Build where clause
    const where: FindOptionsWhere<Message> = {
      conversation: { id: conversationId },
      deletedAt: IsNull(), // Exclude deleted messages
    };

    // Add date filters
    if (dto.startDate || dto.endDate) {
      const startDate = dto.startDate ? new Date(dto.startDate) : new Date(0);
      const endDate = dto.endDate ? new Date(dto.endDate) : new Date();
      where.createdAt = Between(startDate, endDate);
    }

    // Add sender filter
    if (dto.senderId) {
      where.sender = { id: dto.senderId };
    }

    // Use PostgreSQL full-text search for better performance
    // Note: This is a simplified version. For production, use ts_query and ts_vector
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.conversation_id = :conversationId', { conversationId })
      .andWhere('message.deleted_at IS NULL')
      .andWhere('message.content ILIKE :query', { query: `%${dto.query}%` });

    // Apply date filters
    if (dto.startDate) {
      queryBuilder.andWhere('message.created_at >= :startDate', {
        startDate: new Date(dto.startDate),
      });
    }
    if (dto.endDate) {
      queryBuilder.andWhere('message.created_at <= :endDate', {
        endDate: new Date(dto.endDate),
      });
    }

    // Apply sender filter
    if (dto.senderId) {
      queryBuilder.andWhere('message.sender_id = :senderId', {
        senderId: dto.senderId,
      });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const items = await queryBuilder
      .orderBy('message.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      items,
      total,
      page,
      limit,
    };
  }
}

