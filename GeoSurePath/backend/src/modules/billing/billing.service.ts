import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BillingService {
  private razorpay: any;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private configService: ConfigService,
  ) {
    // Razorpay would be initialized here with keys from ConfigService
    // this.razorpay = new Razorpay({ ... });
  }

  async createOrder(userId: string, amount: number) {
    // In a real implementation, you'd call Razorpay API to create an order
    const orderId = `order_${Math.random().toString(36).substr(2, 9)}`;
    
    const payment = this.paymentRepository.create({
      userId,
      amount,
      currency: 'INR',
      orderId,
      status: 'pending',
    });

    return this.paymentRepository.save(payment);
  }

  async capturePayment(userId: string, orderId: string, paymentId: string) {
    const payment = await this.paymentRepository.findOne({ where: { orderId, userId } });
    if (!payment) throw new Error('Payment order not found');

    payment.paymentId = paymentId;
    payment.status = 'captured';
    return this.paymentRepository.save(payment);
  }

  async getHistory(userId: string) {
    return this.paymentRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }
}
