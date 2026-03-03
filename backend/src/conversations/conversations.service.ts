import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, MoreThan, Repository, IsNull, Between, Like, ILike } from 'typeorm';
import { Conversation, ConversationType } from '../entities/conversation.entity';
import { ConversationParticipant } from '../entities/conversation-participant.entity';
import { Message, MessageType } from '../entities/message.entity';
import { User, UserRole } from '../entities/user.entity';
import { File } from '../entities/file.entity';
import { FilesService } from '../files/files.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { SearchMessagesDto } from './dto/search-messages.dto';
import { GetMediaQueryDto, MediaType, MediaSortBy, MediaSortOrder } from './dto/get-media-query.dto';
import { MediaResponseDto, MediaStatisticsDto } from './dto/media-response.dto';

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
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    @Inject(forwardRef(() => FilesService))
    private readonly filesService: FilesService,
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
      // Only PREMIUM and ADMIN users can create group conversations
      if (creator.role !== UserRole.PREMIUM && creator.role !== UserRole.ADMIN) {
        throw new ForbiddenException(
          'Group chats require a Premium subscription. Upgrade to create group conversations.',
        );
      }

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

    // Optimized query with select to reduce data transfer
    const [items, total] = await this.messageRepository.findAndCount({
      where: {
        conversation: { id: conversationId },
      },
      relations: ['sender', 'attachments'],
      select: {
        id: true,
        content: true,
        messageType: true,
        isRead: true,
        isEdited: true,
        editedAt: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        sender: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
        attachments: {
          id: true,
          filename: true,
          fileUrl: true,
          thumbnailUrl: true,
          mimeType: true,
          fileSize: true,
        },
      },
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
   * Improved version with better HTML sanitization and link detection
   */
  private sanitizeContent(content: string): string {
    if (!content || typeof content !== 'string') {
      return '';
    }

    // Remove null bytes and control characters
    let sanitized = content.replace(/[\x00-\x1F\x7F]/g, '');

    // Strip script tags and event handlers more aggressively
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, ''); // Remove event handlers
    sanitized = sanitized.replace(/javascript:/gi, ''); // Remove javascript: protocol
    sanitized = sanitized.replace(/data:text\/html/gi, ''); // Remove data URIs

    // Strip HTML tags but preserve basic formatting if needed
    // For now, strip all HTML for security
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Decode HTML entities first, then re-escape
    sanitized = sanitized
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Escape special characters for safety
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');

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
      relations: ['sender', 'attachments'],
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

    // Delete associated files if any
    if (message.attachments && message.attachments.length > 0) {
      // Delete files using FilesService which handles storage cleanup
      await this.filesService.deleteFilesByMessageId(messageId);
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

    // Get paginated results with attachments
    const items = await queryBuilder
      .leftJoinAndSelect('message.attachments', 'attachments')
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

  /**
   * Get media files for a conversation with filtering, pagination, and sorting
   */
  async getConversationMedia(
    conversationId: string,
    userId: string,
    query: GetMediaQueryDto,
  ): Promise<MediaResponseDto> {
    // Verify user is participant
    await this.assertUserIsParticipant(conversationId, userId);

    const page = query.page && query.page > 0 ? query.page : 1;
    const requestedLimit = query.limit && query.limit > 0 ? query.limit : 20;
    const limit = Math.min(requestedLimit, 100);

    // Build query
    const queryBuilder = this.fileRepository
      .createQueryBuilder('file')
      .where('file.conversationId = :conversationId', { conversationId })
      .andWhere('file.deletedAt IS NULL');

    // Filter by media type
    if (query.type && query.type !== MediaType.ALL) {
      if (query.type === MediaType.IMAGE) {
        queryBuilder.andWhere('file.mimeType LIKE :imagePattern', {
          imagePattern: 'image/%',
        });
      } else if (query.type === MediaType.VIDEO) {
        queryBuilder.andWhere('file.mimeType LIKE :videoPattern', {
          videoPattern: 'video/%',
        });
      } else if (query.type === MediaType.DOCUMENT) {
        queryBuilder.andWhere(
          '(file.mimeType LIKE :docPattern OR file.mimeType LIKE :pdfPattern OR file.mimeType LIKE :textPattern)',
          {
            docPattern: 'application/%',
            pdfPattern: 'application/pdf',
            textPattern: 'text/%',
          },
        );
        queryBuilder.andWhere('file.mimeType NOT LIKE :imagePattern', {
          imagePattern: 'image/%',
        });
        queryBuilder.andWhere('file.mimeType NOT LIKE :videoPattern', {
          videoPattern: 'video/%',
        });
      }
    }

    // Sorting
    const sortBy = query.sortBy || MediaSortBy.DATE;
    const sortOrder = query.sortOrder || MediaSortOrder.DESC;

    switch (sortBy) {
      case MediaSortBy.SIZE:
        queryBuilder.orderBy('file.fileSize', sortOrder.toUpperCase() as 'ASC' | 'DESC');
        break;
      case MediaSortBy.TYPE:
        queryBuilder.orderBy('file.mimeType', sortOrder.toUpperCase() as 'ASC' | 'DESC');
        break;
      case MediaSortBy.DATE:
      default:
        queryBuilder.orderBy('file.createdAt', sortOrder.toUpperCase() as 'ASC' | 'DESC');
        break;
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const items = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Convert to DTOs using FilesService
    const fileDtos = items.map((file) => this.filesService.toResponseDto(file));

    const totalPages = Math.ceil(total / limit);

    return {
      items: fileDtos,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get media statistics for a conversation
   */
  async getConversationMediaStatistics(
    conversationId: string,
    userId: string,
  ): Promise<MediaStatisticsDto> {
    // Verify user is participant
    await this.assertUserIsParticipant(conversationId, userId);

    // Get all files for the conversation
    const files = await this.fileRepository.find({
      where: {
        conversationId,
        deletedAt: IsNull(),
      },
    });

    // Calculate statistics
    let totalFiles = files.length;
    let totalImages = 0;
    let totalVideos = 0;
    let totalDocuments = 0;
    let totalSize = 0;
    let imagesSize = 0;
    let videosSize = 0;
    let documentsSize = 0;

    for (const file of files) {
      totalSize += file.fileSize || 0;

      if (file.mimeType.startsWith('image/')) {
        totalImages++;
        imagesSize += file.fileSize || 0;
      } else if (file.mimeType.startsWith('video/')) {
        totalVideos++;
        videosSize += file.fileSize || 0;
      } else {
        totalDocuments++;
        documentsSize += file.fileSize || 0;
      }
    }

    return {
      totalFiles,
      totalImages,
      totalVideos,
      totalDocuments,
      totalSize,
      imagesSize,
      videosSize,
      documentsSize,
    };
  }
}

