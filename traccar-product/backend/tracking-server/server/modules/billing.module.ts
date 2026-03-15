import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from '../../src/database/entities/plan.entity';
import { Subscription } from '../../src/database/entities/subscription.entity';
import { Invoice } from '../../src/database/entities/invoice.entity';
import { Payment } from '../../src/database/entities/payment.entity';
import { BillingService } from '../../src/services/billing.service';
import { BillingController } from '../../src/api/billing.controller';
import { SubscriptionsService } from '../../src/services/subscriptions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plan, Subscription, Invoice, Payment]),
  ],
  providers: [BillingService, SubscriptionsService],
  controllers: [BillingController],
  exports: [BillingService, SubscriptionsService],
})
export class BillingModule {}
