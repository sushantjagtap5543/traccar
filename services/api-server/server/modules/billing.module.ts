import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../../database/entities/payment.entity'; 
import { BillingService } from '../../services/billing.service';
import { BillingController } from '../../api/billing.controller';
import { SubscriptionsModule } from './subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    SubscriptionsModule,
  ],
  providers: [BillingService],
  controllers: [BillingController],
  exports: [BillingService],
})
export class BillingModule {}
