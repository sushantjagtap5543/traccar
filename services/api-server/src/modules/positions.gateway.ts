import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../../auth/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'positions',
})
export class PositionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token?.split(' ')[1] || client.handshake.query.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      client.data.userId = userId;
      
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(client.id);

      console.log(`User ${userId} connected to positions gateway`);
    } catch (e) {
      console.log('Failing to connect to positions gateway');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId).delete(client.id);
      if (this.userSockets.get(userId).size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  broadcastToUser(userId: string, event: string, data: any) {
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach(id => {
        this.server.to(id).emit(event, data);
      });
    }
  }

  // Legacy support or internal use
  broadcastAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}
