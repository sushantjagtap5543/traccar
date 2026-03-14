import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Device } from '../devices/entities/device.entity';
import { Client } from '../clients/entities/client.entity';
import { Alert } from '../alerts/entities/alert.entity';
import { RedisService } from '../redis/redis.service';
import { TraccarService } from '../traccar/traccar.service';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    private redisService: RedisService,
    private traccarService: TraccarService,
  ) {}

  async getAdminStats() {
    const cacheKey = 'stats:admin';
    const cached = await this.redisService.get(cacheKey);
    if (cached) return cached;

    const totalVehicles = await this.deviceRepository.count();
    const onlineVehicles = await this.deviceRepository.count({ where: { status: 'moving' } });
    const offlineVehicles = await this.deviceRepository.count({ where: { status: 'offline' } });
    const activeClients = await this.clientRepository.count({ where: { status: 'active' } });
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const alertsToday = await this.alertRepository.count({
      where: { createdAt: Between(todayStart, new Date()) }
    });

    const stats = {
      totalVehicles,
      onlineVehicles,
      offlineVehicles,
      activeClients,
      alertsToday,
      distanceToday: 0, 
    };

    await this.redisService.set(cacheKey, stats, 300); // 5 minutes cache
    return stats;
  }

  async getClientStats(clientId: string) {
    const cacheKey = `stats:client:${clientId}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return cached;

    const totalVehicles = await this.deviceRepository.count({ where: { clientId } });
    const alertsCount = await this.alertRepository.count({
      where: { device: { clientId } }
    });

    const stats = {
      myVehicles: totalVehicles,
      alerts: alertsCount,
      tripHistory: [],
      fuelReports: [],
      driverBehaviour: 'Good',
    };

    await this.redisService.set(cacheKey, stats, 300); // 5 minutes cache
    return stats;
  }
}
