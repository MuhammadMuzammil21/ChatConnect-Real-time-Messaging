import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
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

@ApiTags('conversations')
@ApiBearerAuth('JWT-auth')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

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
}

