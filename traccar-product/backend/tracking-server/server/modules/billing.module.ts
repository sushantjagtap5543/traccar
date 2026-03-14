import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from '../../src/database/entities/plan.entity';
import { Subscription } from '../../src/database/entities/subscription.entity';
import { Invoice } from '../../src/database/entities/invoice.entity';
import { Payment } from '../../src/database/entities/payment.entity';
import { BillingService } from '../../../billing/billingService';
import { InvoiceController } from '../../../billing/invoiceController';
import { SubscriptionService } from '../../../billing/subscriptionService';
import { PaymentService } from '../../../billing/paymentService';
import { InvoiceService } from '../../../billing/invoiceService';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plan, Subscription, Invoice, Payment]),
  ],
  providers: [BillingService, SubscriptionService, PaymentService, InvoiceService],
  controllers: [InvoiceController],
  exports: [BillingService, SubscriptionService, PaymentService, InvoiceService],
})
export class BillingModule {}
