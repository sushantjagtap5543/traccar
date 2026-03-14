import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UseGuards, UnauthorizedException } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'positions',
})
export class PositionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private clients = new Map<string, Set<string>>(); // userId -> set of socketIds
  private clientRooms = new Map<string, Set<string>>(); // clientId -> set of socketIds

  constructor(private jwtService: JwtService) {}

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) throw new UnauthorizedException();

      const payload = this.jwtService.verify(token);
      socket.data.user = payload;

      const userId = payload.userId;
      const clientId = payload.clientId;

      // Join user room
      if (userId) {
        if (!this.clients.has(userId)) this.clients.set(userId, new Set());
        this.clients.get(userId).add(socket.id);
        socket.join(`user:${userId}`);
      }

      // Join client (business) room
      if (clientId) {
        if (!this.clientRooms.has(clientId)) this.clientRooms.set(clientId, new Set());
        this.clientRooms.get(clientId).add(socket.id);
        socket.join(`client:${clientId}`);
      }

      console.log(`Socket ${socket.id} connected for user ${userId}`);
    } catch (e) {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const userId = socket.data.user?.userId;
    const clientId = socket.data.user?.clientId;

    if (userId && this.clients.has(userId)) {
      this.clients.get(userId).delete(socket.id);
    }
    if (clientId && this.clientRooms.has(clientId)) {
      this.clientRooms.get(clientId).delete(socket.id);
    }
    console.log(`Socket ${socket.id} disconnected`);
  }

  broadcastToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  broadcastToClient(clientId: string, event: string, data: any) {
    this.server.to(`client:${clientId}`).emit(event, data);
  }

  broadcastAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}
