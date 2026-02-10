import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtWsGuard } from './guards/jwt-ws.guard';

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
}

