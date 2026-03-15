import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private clients = new Map<string, { count: number; lastReset: number }>();
  private readonly LIMIT = 100; // 100 requests
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip;
    const now = Date.now();
    const clientData = this.clients.get(ip) || { count: 0, lastReset: now };

    if (now - clientData.lastReset > this.WINDOW_MS) {
      clientData.count = 0;
      clientData.lastReset = now;
    }

    clientData.count++;
    this.clients.set(ip, clientData);

    if (clientData.count > this.LIMIT) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    next();
  }
}
