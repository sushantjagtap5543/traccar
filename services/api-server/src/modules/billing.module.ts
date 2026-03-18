import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../database/entities/payment.entity'; 
import { Plan } from '../database/entities/plan.entity'; 
import { Device } from '../database/entities/device.entity'; 
import { Permission } from '../database/entities/permission.entity'; 
import { BillingService } from '../services/billing.service';
import { BillingController } from '../api/billing.controller';
import { SubscriptionsModule } from './subscriptions.module';
import { AlertsModule } from './alerts.module';
import { UsersModule } from './users.module';
import { RenewalNotificationService } from '../services/renewal-notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Plan, Device, Permission]),
    SubscriptionsModule,
    AlertsModule,
    UsersModule,
  ],
  providers: [BillingService, RenewalNotificationService],
  controllers: [BillingController],
  exports: [BillingService],
})
export class BillingModule {}
