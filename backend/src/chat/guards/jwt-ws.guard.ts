import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../auth/auth.service';
import { Socket } from 'socket.io';

@Injectable()
export class JwtWsGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();

    const token = this.extractTokenFromClient(client);
    if (!token) {
      throw new UnauthorizedException('Missing WebSocket auth token');
    }

    try {
      const secret =
        this.configService.get<string>('JWT_SECRET') || 'default-secret-key';
      const payload = await this.jwtService.verifyAsync(token, { secret });

      const user = await this.authService.validateUser(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      if (user.isBanned) {
        throw new UnauthorizedException('User is banned');
      }

      // Attach to socket for later access in gateway
      client.data.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid WebSocket auth token');
    }
  }

  private extractTokenFromClient(client: Socket): string | null {
    // Preferred: query parameter `token` or auth header-like in handshake
    const authHeader =
      (client.handshake.headers.authorization as string | undefined) ?? '';
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    const queryToken = client.handshake.auth?.token || client.handshake.query?.token;
    if (typeof queryToken === 'string') {
      return queryToken;
    }

    return null;
  }
}

