import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ShareToken } from '../database/entities/share-token.entity';
import { DevicesService } from './devices.service';

@Injectable()
export class ShareService {
  constructor(
    @InjectRepository(ShareToken)
    private shareRepository: Repository<ShareToken>,
    private devicesService: DevicesService,
  ) {}

  async createToken(userId: string, deviceId: string, hours: number) {
    // Verify ownership
    await this.devicesService.findOne(deviceId, userId);

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hours);

    const token = this.shareRepository.create({
      deviceId,
      code,
      expiresAt,
    });

    return this.shareRepository.save(token);
  }

  async validateToken(code: string) {
    const token = await this.shareRepository.findOne({
      where: { code, expiresAt: MoreThan(new Date()) }
    });
    if (!token) throw new NotFoundException('Tracking Protocol Expired or Invalid');
    return token;
  }

  async getActiveTokens(userId: string, deviceId: string) {
    // Verify ownership
    await this.devicesService.findOne(deviceId, userId);
    return this.shareRepository.find({
        where: { deviceId, expiresAt: MoreThan(new Date()) },
        order: { createdAt: 'DESC' }
    });
  }
}
