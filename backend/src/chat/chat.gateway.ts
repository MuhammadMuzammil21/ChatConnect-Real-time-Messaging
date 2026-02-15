import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { JwtWsGuard } from './guards/jwt-ws.guard';
import { MessageRateLimitService } from './message-rate-limit.service';
import { AuthService } from '../auth/auth.service';
import { ConversationsService } from '../conversations/conversations.service';
import { Message, MessageType } from '../entities/message.entity';
import { UserStatusService } from '../user-status/user-status.service';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  // Enhanced session map: userId -> Set of socket IDs (for multi-device support)
  private userSessions = new Map<string, Set<string>>();
  // Reverse map: socket.id -> userId for quick lookup
  private socketToUser = new Map<string, string>();
  // Typing state: conversationId -> Set of userIds currently typing
  private typingUsers = new Map<string, Map<string, NodeJS.Timeout>>();

  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly userStatusService: UserStatusService,
    private readonly messageRateLimitService: MessageRateLimitService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    // Guards do not run before handleConnection in NestJS WebSockets, so we authenticate here.
    const user = await this.authenticateConnection(client);
    if (!user) {
      this.logger.debug(
        `Unauthorized socket connection (missing or invalid token): ${client.id}`,
      );
      client.disconnect(true);
      return;
    }

    const userId = user.id;

    // Track socket to user mapping
    this.socketToUser.set(client.id, userId);

    // Track user sessions (multi-device support)
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(client.id);

    // Join user to personal room for status broadcasts
    await client.join(this.getUserRoomName(userId));

    // Set user status to ONLINE
    await this.userStatusService.setUserOnline(userId);

    // Broadcast status change to user's contacts
    this.server.emit('userStatusChanged', {
      userId,
      status: 'ONLINE',
      lastSeen: new Date(),
    });

    this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
  }

  /**
   * Authenticate the socket using handshake token. Returns user payload or null if invalid.
   */
  private async authenticateConnection(
    client: Socket,
  ): Promise<{ id: string; email: string; role: string } | null> {
    const token = this.extractTokenFromClient(client);
    if (!token) return null;

    try {
      const secret =
        this.configService.get<string>('JWT_SECRET') || 'default-secret-key';
      const payload = await this.jwtService.verifyAsync(token, { secret });

      const user = await this.authService.validateUser(payload.sub);
      if (!user || user.isBanned) return null;

      const userPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
      client.data.user = userPayload;
      return userPayload;
    } catch {
      return null;
    }
  }

  private extractTokenFromClient(client: Socket): string | null {
    const authHeader =
      (client.handshake.headers.authorization as string | undefined) ?? '';
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    const queryToken =
      client.handshake.auth?.token || client.handshake.query?.token;
    if (typeof queryToken === 'string') return queryToken;
    return null;
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = this.socketToUser.get(client.id);
    if (!userId) {
      this.logger.log(`Client disconnected: ${client.id} (no user mapping)`);
      return;
    }

    // Remove socket from user sessions
    const userSocketSet = this.userSessions.get(userId);
    if (userSocketSet) {
      userSocketSet.delete(client.id);

      // If user has no more active connections, set status to OFFLINE
      if (userSocketSet.size === 0) {
        this.userSessions.delete(userId);
        await this.userStatusService.setUserOffline(userId);

        // Broadcast status change
        this.server.emit('userStatusChanged', {
          userId,
          status: 'OFFLINE',
          lastSeen: new Date(),
        });
      }
    }

    this.socketToUser.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id} (user: ${userId})`);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('ping')
  handlePing(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ): { event: string; data: any } {
    const user = client.data.user;
    this.logger.debug(
      `Received ping from ${client.id} (user: ${user?.id}): ${JSON.stringify(
        payload,
      )}`,
    );
    return { event: 'pong', data: { ts: Date.now(), payload } };
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ): Promise<{ event: string; data: any }> {
    const userId = this.socketToUser.get(client.id);
    if (!userId) {
      throw new WsException('Unauthorized');
    }

    if (!payload?.conversationId) {
      throw new WsException('conversationId is required');
    }

    await this.conversationsService.assertUserIsParticipant(
      payload.conversationId,
      userId,
    );

    const roomName = this.getConversationRoomName(payload.conversationId);
    await client.join(roomName);
    this.logger.debug(
      `User ${userId} joined conversation room ${roomName} (socket: ${client.id})`,
    );

    return {
      event: 'conversationJoined',
      data: { conversationId: payload.conversationId },
    };
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('leaveConversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ): Promise<{ event: string; data: any }> {
    const userId = this.socketToUser.get(client.id);
    if (!userId) {
      throw new WsException('Unauthorized');
    }

    if (!payload?.conversationId) {
      throw new WsException('conversationId is required');
    }

    const roomName = this.getConversationRoomName(payload.conversationId);
    await client.leave(roomName);
    this.logger.debug(
      `User ${userId} left conversation room ${roomName} (socket: ${client.id})`,
    );

    return {
      event: 'conversationLeft',
      data: { conversationId: payload.conversationId },
    };
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('sendConversationMessage')
  async handleSendConversationMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { conversationId: string; content: string; messageType?: MessageType },
  ): Promise<{ event: string; data: any }> {
    const userId = this.socketToUser.get(client.id);
    if (!userId) {
      throw new WsException('Unauthorized');
    }

    const { conversationId, content, messageType } = payload || {};
    if (!conversationId || !content || !content.trim()) {
      throw new WsException('conversationId and non-empty content are required');
    }

    if (!this.messageRateLimitService.tryAcquire(userId)) {
      const retryAfter = this.messageRateLimitService.getRetryAfterSeconds(userId);
      throw new WsException(
        retryAfter > 0
          ? `Rate limit exceeded. Try again in ${retryAfter} seconds.`
          : 'Rate limit exceeded. Please slow down.',
      );
    }

    let message: Message;
    try {
      message = await this.conversationsService.createMessage(
        conversationId,
        userId,
        content.trim(),
        messageType ?? MessageType.TEXT,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to create message in conversation ${conversationId}: ${error.message}`,
      );
      throw new WsException(error.message ?? 'Failed to send message');
    }

    const roomName = this.getConversationRoomName(conversationId);
    const payloadToBroadcast = {
      id: message.id,
      content: message.content,
      senderId: message.sender.id,
      conversationId,
      messageType: message.messageType,
      createdAt: message.createdAt,
    };

    this.server.to(roomName).emit('conversationMessage', payloadToBroadcast);

    // Push real-time unread count to other participants (exclude sender)
    const participantIds =
      await this.conversationsService.getConversationParticipantUserIds(
        conversationId,
      );
    for (const participantId of participantIds) {
      if (participantId === userId) continue;
      const count =
        await this.conversationsService.getUnreadCountForConversation(
          conversationId,
          participantId,
        );
      this.server.to(this.getUserRoomName(participantId)).emit(
        'unreadCountUpdated',
        { conversationId, unreadCount: count },
      );
    }

    return {
      event: 'messageSent',
      data: {
        conversationId,
        messageId: message.id,
        messageType: message.messageType,
        createdAt: message.createdAt,
      },
    };
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('markConversationRead')
  async handleMarkConversationRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ): Promise<{ event: string; data: any }> {
    const userId = this.socketToUser.get(client.id);
    if (!userId) {
      throw new WsException('Unauthorized');
    }

    const { conversationId } = payload || {};
    if (!conversationId) {
      throw new WsException('conversationId is required');
    }

    try {
      await this.conversationsService.markConversationAsRead(
        conversationId,
        userId,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to mark conversation ${conversationId} as read: ${error.message}`,
      );
      throw new WsException(error.message ?? 'Failed to mark as read');
    }

    const readAt = new Date();

    // Notify reader's clients with unreadCount: 0
    const userRoomName = this.getUserRoomName(userId);
    this.server.to(userRoomName).emit('conversationRead', {
      conversationId,
      readAt,
      unreadCount: 0,
    });

    // Notify other participants in the conversation (for read receipts / UI updates)
    const roomName = this.getConversationRoomName(conversationId);
    this.server.to(roomName).emit('userMarkedConversationRead', {
      userId,
      conversationId,
      readAt,
    });

    return {
      event: 'conversationMarkedRead',
      data: {
        conversationId,
        readAt,
        unreadCount: 0,
      },
    };
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('typingStart')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ): Promise<{ event: string; data: any }> {
    const userId = this.socketToUser.get(client.id);
    if (!userId) {
      throw new WsException('Unauthorized');
    }

    const { conversationId } = payload || {};
    if (!conversationId) {
      throw new WsException('conversationId is required');
    }

    // Verify user is participant
    await this.conversationsService.assertUserIsParticipant(
      conversationId,
      userId,
    );

    // Track typing state with auto-timeout
    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Map());
    }

    const conversationTyping = this.typingUsers.get(conversationId)!;

    // Clear existing timeout if any
    const existingTimeout = conversationTyping.get(userId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout (auto-stop after 3 seconds)
    const timeout = setTimeout(() => {
      this.handleTypingTimeout(conversationId, userId);
    }, 3000);

    conversationTyping.set(userId, timeout);

    // Broadcast to conversation room (exclude sender)
    const roomName = this.getConversationRoomName(conversationId);
    client.to(roomName).emit('userTyping', {
      userId,
      conversationId,
      timestamp: new Date(),
    });

    return {
      event: 'typingStarted',
      data: { conversationId },
    };
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('typingStop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ): Promise<{ event: string; data: any }> {
    const userId = this.socketToUser.get(client.id);
    if (!userId) {
      throw new WsException('Unauthorized');
    }

    const { conversationId } = payload || {};
    if (!conversationId) {
      throw new WsException('conversationId is required');
    }

    this.clearTypingState(conversationId, userId);

    // Broadcast to conversation room
    const roomName = this.getConversationRoomName(conversationId);
    client.to(roomName).emit('userStoppedTyping', {
      userId,
      conversationId,
    });

    return {
      event: 'typingStopped',
      data: { conversationId },
    };
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('heartbeat')
  async handleHeartbeat(
    @ConnectedSocket() client: Socket,
  ): Promise<{ event: string; data: any }> {
    const userId = this.socketToUser.get(client.id);
    if (!userId) {
      throw new WsException('Unauthorized');
    }

    await this.userStatusService.updateHeartbeat(userId);

    return {
      event: 'heartbeatAck',
      data: { timestamp: new Date() },
    };
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string; content: string },
  ): Promise<{ event: string; data: any }> {
    const userId = this.socketToUser.get(client.id);
    if (!userId) {
      throw new WsException('Unauthorized');
    }

    const { messageId, content } = payload || {};
    if (!messageId || !content) {
      throw new WsException('messageId and content are required');
    }

    let editedMessage;
    try {
      editedMessage = await this.conversationsService.editMessage(
        messageId,
        userId,
        { content },
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to edit message ${messageId}: ${error.message}`,
      );
      throw new WsException(error.message ?? 'Failed to edit message');
    }

    // Broadcast to conversation room
    const roomName = this.getConversationRoomName(
      editedMessage.conversation.id,
    );
    this.server.to(roomName).emit('messageEdited', {
      messageId: editedMessage.id,
      content: editedMessage.content,
      editedAt: editedMessage.editedAt,
      conversationId: editedMessage.conversation.id,
    });

    return {
      event: 'messageEditedSuccess',
      data: {
        messageId: editedMessage.id,
        content: editedMessage.content,
        editedAt: editedMessage.editedAt,
      },
    };
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string; conversationId: string },
  ): Promise<{ event: string; data: any }> {
    const userId = this.socketToUser.get(client.id);
    if (!userId) {
      throw new WsException('Unauthorized');
    }

    const { messageId, conversationId } = payload || {};
    if (!messageId || !conversationId) {
      throw new WsException('messageId and conversationId are required');
    }

    try {
      await this.conversationsService.deleteMessage(messageId, userId);
    } catch (error: any) {
      this.logger.error(
        `Failed to delete message ${messageId}: ${error.message}`,
      );
      throw new WsException(error.message ?? 'Failed to delete message');
    }

    // Broadcast to conversation room
    const roomName = this.getConversationRoomName(conversationId);
    this.server.to(roomName).emit('messageDeleted', {
      messageId,
      conversationId,
      deletedAt: new Date(),
    });

    return {
      event: 'messageDeletedSuccess',
      data: {
        messageId,
        conversationId,
        deletedAt: new Date(),
      },
    };
  }

  private handleTypingTimeout(conversationId: string, userId: string): void {
    this.clearTypingState(conversationId, userId);

    // Broadcast typing stopped
    const roomName = this.getConversationRoomName(conversationId);
    this.server.to(roomName).emit('userStoppedTyping', {
      userId,
      conversationId,
    });
  }

  private clearTypingState(conversationId: string, userId: string): void {
    const conversationTyping = this.typingUsers.get(conversationId);
    if (conversationTyping) {
      const timeout = conversationTyping.get(userId);
      if (timeout) {
        clearTimeout(timeout);
        conversationTyping.delete(userId);
      }

      if (conversationTyping.size === 0) {
        this.typingUsers.delete(conversationId);
      }
    }
  }

  private getConversationRoomName(conversationId: string): string {
    return `conversation:${conversationId}`;
  }

  private getUserRoomName(userId: string): string {
    return `user:${userId}`;
  }
}

