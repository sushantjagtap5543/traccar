import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Device } from '../database/entities/device.entity';
import { User } from '../database/entities/user.entity';
import { Event } from '../database/entities/event.entity';
import { RedisService } from './redis.service';
import { TraccarService } from './traccar.service';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    private redisService: RedisService,
    private traccarService: TraccarService,
  ) {}

  async getAdminStats() {
    const cacheKey = 'stats:admin';
    const cached = await this.redisService.get(cacheKey);
    if (cached) return cached;

    const totalVehicles = await this.deviceRepository.count();
    const onlineVehicles = await this.deviceRepository.count({ where: { status: 'moving' } as any });
    const offlineVehicles = await this.deviceRepository.count({ where: { status: 'offline' } as any });
    const activeUsers = await this.userRepository.count({ where: { disabled: false } });
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const eventsToday = await this.eventRepository.count({
      where: { eventTime: Between(todayStart, new Date()) }
    });

    const stats = {
      totalVehicles,
      onlineVehicles,
      offlineVehicles,
      activeUsers,
      eventsToday,
      distanceToday: 0, 
    };

    await this.redisService.set(cacheKey, stats, 300); // 5 minutes cache
    return stats;
  }

  async getUserStats(userId: string) {
    const cacheKey = `stats:user:${userId}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return cached;

    const devicesCount = await this.deviceRepository
      .createQueryBuilder('device')
      .innerJoin('permissions', 'p', 'p.device_id = device.id')
      .where('p.user_id = :userId', { userId })
      .getCount();

    const stats = {
      myVehicles: devicesCount,
      alerts: 0, 
      tripHistory: [],
      fuelReports: [],
      driverBehaviour: 'Good',
    };

    await this.redisService.set(cacheKey, stats, 300); // 5 minutes cache
    return stats;
  }
}
