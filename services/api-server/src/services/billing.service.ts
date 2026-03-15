import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../database/entities/payment.entity';
import { ConfigService } from '@nestjs/config';
const Razorpay = require('razorpay');
import * as crypto from 'crypto';

import { SubscriptionsService } from './subscriptions.service';

@Injectable()
export class BillingService {
  private razorpay: any;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private configService: ConfigService,
    private subscriptionsService: SubscriptionsService,
  ) {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret || keyId.includes('placeholder') || keySecret.includes('placeholder')) {
      throw new Error('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not correctly defined in environment!');
    }

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  async createOrder(userId: string, planId: string) {
    let baseAmount = 0;
    if (planId === '1month') baseAmount = 200;
    else if (planId === '6month') baseAmount = 950;
    else if (planId === '12month') baseAmount = 1500;
    else throw new BadRequestException('Invalid plan selected');

    const amount = Math.round(baseAmount * 100 * 1.18); // Paisa + 18% GST

    const options = {
      amount,
      currency: 'INR',
      receipt: `geosure_${Date.now()}`,
    };

    const order = await this.razorpay.orders.create(options);

    const payment = this.paymentRepository.create({
      userId,
      amount: amount / 100,
      currency: 'INR',
      orderId: order.id,
      status: 'pending',
      attributes: { planId }
    });

    await this.paymentRepository.save(payment);
    return order;
  }

  async verifyPayment(userId: string, orderId: string, paymentId: string, signature: string, imei: string) {
    const text = orderId + '|' + paymentId;
    const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (!secret) throw new BadRequestException('Payment gateway configuration error');
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');

    if (generated_signature !== signature) {
      throw new BadRequestException('Invalid payment signature');
    }

    const payment = await this.paymentRepository.findOne({ where: { orderId, userId } });
    if (!payment) throw new BadRequestException('Payment record not found');

    payment.paymentId = paymentId;
    payment.status = 'captured';
    await this.paymentRepository.save(payment);

    // Extend subscription
    const planId = (payment.attributes as any).planId;
    await this.subscriptionsService.extendSubscription(imei, planId);

    return { success: true };
  }

  async getHistory(userId: string) {
    return this.paymentRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }
}
