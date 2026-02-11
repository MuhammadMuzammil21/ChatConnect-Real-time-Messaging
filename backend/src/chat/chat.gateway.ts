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
import { Server, Socket } from 'socket.io';
import { JwtWsGuard } from './guards/jwt-ws.guard';
import { ConversationsService } from '../conversations/conversations.service';
import { Message } from '../entities/message.entity';

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

  // Simple in-memory session map: socket.id -> userId
  private sessions = new Map<string, string>();

  constructor(private readonly conversationsService: ConversationsService) {}

  @UseGuards(JwtWsGuard)
  async handleConnection(@ConnectedSocket() client: Socket) {
    const user = client.data.user as { id: string; email: string } | undefined;
    if (!user) {
      this.logger.warn(`Unauthorized socket connection attempt: ${client.id}`);
      client.disconnect(true);
      return;
    }

    this.sessions.set(client.id, user.id);
    this.logger.log(`Client connected: ${client.id} (user: ${user.id})`);
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = this.sessions.get(client.id);
    this.sessions.delete(client.id);
    this.logger.log(
      `Client disconnected: ${client.id}${userId ? ` (user: ${userId})` : ''}`,
    );
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
    const userId = this.sessions.get(client.id);
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
    const userId = this.sessions.get(client.id);
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
    payload: { conversationId: string; content: string },
  ): Promise<{ event: string; data: any }> {
    const userId = this.sessions.get(client.id);
    if (!userId) {
      throw new WsException('Unauthorized');
    }

    const { conversationId, content } = payload || {};
    if (!conversationId || !content || !content.trim()) {
      throw new WsException('conversationId and non-empty content are required');
    }

    let message: Message;
    try {
      message = await this.conversationsService.createMessage(
        conversationId,
        userId,
        content.trim(),
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to create message in conversation ${conversationId}: ${error.message}`,
      );
      throw new WsException(error.message ?? 'Failed to send message');
    }

    const roomName = this.getConversationRoomName(conversationId);
    this.server.to(roomName).emit('conversationMessage', {
      id: message.id,
      content: message.content,
      senderId: message.sender.id,
      conversationId,
      createdAt: message.createdAt,
    });

    return {
      event: 'messageSent',
      data: {
        conversationId,
        messageId: message.id,
      },
    };
  }

  private getConversationRoomName(conversationId: string): string {
    return `conversation:${conversationId}`;
  }
}

