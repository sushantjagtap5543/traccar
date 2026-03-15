import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (context.getType() !== 'ws') {
      return true;
    }

    const client = context.switchToWs().getClient();
    const token = client.handshake.auth.token?.split(' ')[1] || client.handshake.query.token;

    if (!token) {
      return false;
    }

    try {
      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      return true;
    } catch (e) {
      return false;
    }
  }
}
