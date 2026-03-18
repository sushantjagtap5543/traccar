import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionsService } from './subscriptions.service';
import { AlertsService } from './alerts.service';
import { UsersService } from './users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../database/entities/device.entity';
import { Permission } from '../database/entities/permission.entity';

@Injectable()
export class RenewalNotificationService {
  private readonly logger = new Logger(RenewalNotificationService.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly alertsService: AlertsService,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly usersService: UsersService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkRenewals() {
    this.logger.log('Strategic scan: Identifying assets requiring renewal...');
    const subscriptions = await this.subscriptionsService.findAll();
    const now = new Date();
    const notificationThreshold = 10; // Days

    for (const sub of subscriptions) {
      const expirationDate = new Date(sub.endDate);
      const diffTime = expirationDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === notificationThreshold) {
        this.logger.log(`Asset ${sub.imei} expiring in 10 days. Dispatching alerts.`);
        
        // Find owner of this device
        const device = await this.deviceRepository.findOne({ where: { uniqueId: sub.imei } });
        if (device) {
           const permissions = await this.permissionRepository.find({ where: { deviceId: device.id } });
           for (const p of permissions) {
               await this.alertsService.createEvent(p.userId, {
                  type: 'subscriptionExpiring',
                  attributes: { imei: sub.imei, daysLeft: 10, message: `Tactical Alert: Asset system signature ${sub.imei} expires in 10 days.` }
               });
           }
        }
      }
    }
  }
}
