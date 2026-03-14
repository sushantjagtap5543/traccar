import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { Payment } from './entities/payment.entity'; // Maintain existing entity if needed
import { BillingService } from '../../billing/billingService';
import { InvoiceController } from '../../billing/invoiceController';
import { SubscriptionService } from '../../billing/subscriptionService';
import { PaymentService } from '../../billing/paymentService';

@Module({
  imports: [
    // TypeOrmModule.forFeature([Payment]),
  ],
  providers: [BillingService, SubscriptionService, PaymentService],
  controllers: [InvoiceController],
  exports: [BillingService, SubscriptionService, PaymentService],
})
export class BillingModule {}
