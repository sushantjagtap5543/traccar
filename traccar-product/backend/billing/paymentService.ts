import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../tracking-server/src/database/entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async processPayment(invoiceId: number, amount: number, method: string) {
    // Note: Actual Razorpay integration would go here
    // For now, we create a record of the payment attempt
    const payment = this.paymentRepository.create({
      invoiceId,
      amount,
      method,
      status: 'pending',
    });

    return await this.paymentRepository.save(payment);
  }

  async verifyTransaction(paymentId: number, transactionId: string) {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!payment) throw new Error('Payment record not found');

    payment.transactionId = transactionId;
    payment.status = 'success'; // Assuming verification is handled by webhook or frontend callback

    return await this.paymentRepository.save(payment);
  }
}
