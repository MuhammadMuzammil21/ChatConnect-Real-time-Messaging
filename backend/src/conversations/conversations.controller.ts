import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { Conversation } from '../entities/conversation.entity';
import { ConversationParticipantGuard } from './guards/conversation-participant.guard';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
import { PaginatedMessagesResponseDto } from './dto/paginated-messages-response.dto';
import { UnreadCountDto } from './dto/unread-count.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { SearchMessagesDto } from './dto/search-messages.dto';
import { Message } from '../entities/message.entity';
import { GetMediaQueryDto } from './dto/get-media-query.dto';
import { MediaResponseDto, MediaStatisticsDto } from './dto/media-response.dto';

@ApiTags('conversations')
@ApiBearerAuth('JWT-auth')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({
    status: 201,
    description: 'Conversation created successfully',
    type: Conversation,
  })
  async createConversation(
    @CurrentUser() user: User,
    @Body() dto: CreateConversationDto,
  ): Promise<Conversation> {
    return this.conversationsService.createConversation(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get conversations for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of user conversations',
    type: [Conversation],
  })
  async getUserConversations(@CurrentUser() user: User): Promise<Conversation[]> {
    return this.conversationsService.getUserConversations(user.id);
  }

  @Get('unread-counts')
  @ApiOperation({
    summary: 'Get unread message counts for all conversations of the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of conversation IDs with unread counts',
    type: [UnreadCountDto],
  })
  async getAllUnreadCounts(
    @CurrentUser() user: User,
  ): Promise<UnreadCountDto[]> {
    return this.conversationsService.getAllUnreadCountsForUser(user.id);
  }

  @Get(':id')
  @UseGuards(ConversationParticipantGuard)
  @ApiOperation({ summary: 'Get details of a specific conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Conversation details',
    type: Conversation,
  })
  async getConversationDetails(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Conversation> {
    return this.conversationsService.getConversationForUser(id, user.id);
  }

  @Post(':id/participants')
  @ApiOperation({ summary: 'Add a participant to a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Participant added and updated conversation returned',
    type: Conversation,
  })
  async addParticipant(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: AddParticipantDto,
  ): Promise<Conversation> {
    return this.conversationsService.addParticipant(id, user.id, dto);
  }

  @Delete(':id/participants/:userId')
  @ApiOperation({ summary: 'Remove a participant from a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID', type: String })
  @ApiParam({ name: 'userId', description: 'User ID to remove', type: String })
  @ApiResponse({
    status: 200,
    description: 'Participant removed and updated conversation returned',
    type: Conversation,
  })
  async removeParticipant(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ): Promise<Conversation> {
    return this.conversationsService.removeParticipant(id, user.id, userId);
  }

  @Get(':id/messages')
  @UseGuards(ConversationParticipantGuard)
  @ApiOperation({ summary: 'Get paginated message history for a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of messages in the conversation',
    type: PaginatedMessagesResponseDto,
  })
  async getConversationMessages(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Query() query: GetMessagesQueryDto,
  ): Promise<PaginatedMessagesResponseDto> {
    return this.conversationsService.getMessageHistory(id, user.id, query);
  }

  @Get(':id/unread-count')
  @UseGuards(ConversationParticipantGuard)
  @ApiOperation({
    summary: 'Get unread message count for the current user in a conversation',
  })
  @ApiParam({ name: 'id', description: 'Conversation ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Unread message count for the conversation',
    type: UnreadCountDto,
  })
  async getUnreadCount(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<UnreadCountDto> {
    const unreadCount =
      await this.conversationsService.getUnreadCountForConversation(
        id,
        user.id,
      );

    return {
      conversationId: id,
      unreadCount,
    };
  }

  @Post(':id/mark-read')
  @UseGuards(ConversationParticipantGuard)
  @ApiOperation({
    summary: 'Mark conversation as read for the current user',
  })
  @ApiParam({ name: 'id', description: 'Conversation ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Conversation marked as read',
  })
  async markConversationAsRead(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean }> {
    await this.conversationsService.markConversationAsRead(id, user.id);
    return { success: true };
  }

  @Put('messages/:messageId')
  @ApiOperation({ summary: 'Edit a message' })
  @ApiParam({ name: 'messageId', description: 'Message ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Message edited successfully',
    type: Message,
  })
  async editMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateMessageDto,
  ): Promise<Message> {
    return this.conversationsService.editMessage(messageId, user.id, dto);
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'messageId', description: 'Message ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Message deleted successfully',
  })
  async deleteMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean }> {
    return this.conversationsService.deleteMessage(messageId, user.id);
  }

  @Get(':id/messages/search')
  @UseGuards(ConversationParticipantGuard)
  @ApiOperation({ summary: 'Search messages in a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: PaginatedMessagesResponseDto,
  })
  async searchMessages(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Query() dto: SearchMessagesDto,
  ): Promise<PaginatedMessagesResponseDto> {
    return this.conversationsService.searchMessages(id, user.id, dto);
  }

  @Get(':id/media')
  @UseGuards(ConversationParticipantGuard)
  @ApiOperation({ summary: 'Get media files for a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Media files retrieved successfully',
    type: MediaResponseDto,
  })
  async getConversationMedia(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Query() query: GetMediaQueryDto,
  ): Promise<MediaResponseDto> {
    return this.conversationsService.getConversationMedia(id, user.id, query);
  }

  @Get(':id/media/statistics')
  @UseGuards(ConversationParticipantGuard)
  @ApiOperation({ summary: 'Get media statistics for a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Media statistics retrieved successfully',
    type: MediaStatisticsDto,
  })
  async getConversationMediaStatistics(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<MediaStatisticsDto> {
    return this.conversationsService.getConversationMediaStatistics(id, user.id);
  }
}

