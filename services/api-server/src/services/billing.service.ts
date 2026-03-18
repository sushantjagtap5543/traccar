import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../database/entities/payment.entity';
import { ConfigService } from '@nestjs/config';
const Razorpay = require('razorpay');
import * as crypto from 'crypto';

import { SubscriptionsService } from './subscriptions.service';

import { Plan } from '../database/entities/plan.entity';

@Injectable()
export class BillingService {
  private razorpay: any;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    private configService: ConfigService,
    private subscriptionsService: SubscriptionsService,
  ) {
    // Razorpay init remains same
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (keyId && keySecret) {
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
  }

  async onModuleInit() {
    const count = await this.planRepository.count();
    if (count === 0) {
      const defaultPlans = [
        { name: 'Tactical Monthly', slug: '1month', amount: 200, validityMonths: 1, currency: 'INR' },
        { name: 'Strategic Half-Yearly', slug: '6month', amount: 1100, validityMonths: 6, currency: 'INR' },
        { name: 'Annual Sovereignty', slug: '12month', amount: 2000, validityMonths: 12, currency: 'INR' },
      ];
      await this.planRepository.save(defaultPlans);
    }
  }

  async getPlans() {
    return this.planRepository.find({ order: { validityMonths: 'ASC' } });
  }

  async updatePlan(id: string, data: Partial<Plan>) {
    await this.planRepository.update(id, data);
    return this.planRepository.findOne({ where: { id } });
  }

  async createOrder(userId: string, planId: string) {
    const plan = await this.planRepository.findOne({ where: { slug: planId } });
    if (!plan) throw new BadRequestException('Invalid plan selected');

    const amount = Math.round(Number(plan.amount) * 100 * 1.18); // Paisa + 18% GST

    const options = {
      amount,
      currency: plan.currency || 'INR',
      receipt: `geosure_${Date.now()}`,
    };

    const order = await this.razorpay.orders.create(options);

    const payment = this.paymentRepository.create({
      userId,
      amount: amount / 100,
      currency: plan.currency || 'INR',
      orderId: order.id,
      status: 'pending',
      attributes: { planId: plan.slug, method: 'razorpay' }
    });

    await this.paymentRepository.save(payment);
    return order;
  }

  async verifyPayment(userId: string, orderId: string, paymentId: string, signature: string, imei: string) {
    const text = orderId + '|' + paymentId;
    const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    const generated_signature = crypto.createHmac('sha256', secret).update(text).digest('hex');

    if (generated_signature !== signature) throw new BadRequestException('Invalid signal signature');

    const payment = await this.paymentRepository.findOne({ where: { orderId, userId } });
    if (!payment) throw new BadRequestException('Asset transaction mismatch');

    payment.paymentId = paymentId;
    payment.status = 'captured';
    await this.paymentRepository.save(payment);

    const planId = (payment.attributes as any).planId;
    await this.subscriptionsService.extendSubscription(imei, planId);

    return { success: true };
  }

  async recordCashPayment(adminUserId: string, targetUserId: string, imei: string, planSlug: string) {
    const plan = await this.planRepository.findOne({ where: { slug: planSlug } });
    if (!plan) throw new BadRequestException('Tactical plan not recognized');

    const payment = this.paymentRepository.create({
      userId: targetUserId,
      amount: plan.amount,
      currency: plan.currency || 'INR',
      orderId: `CASH_${Date.now()}`,
      paymentId: `OFFLINE_ADMIN_${adminUserId}`,
      status: 'captured',
      attributes: { planId: planSlug, method: 'cash', recordedBy: adminUserId }
    });

    await this.paymentRepository.save(payment);
    await this.subscriptionsService.extendSubscription(imei, planSlug);
    return { success: true, message: "Cash transaction synchronized." };
  }

  async getHistory(userId: string) {
    return this.paymentRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async getAdminStats() {
     // placeholder for future stats
     return {};
  }

  async clientSubmitCashRecord(userId: string, imei: string, amount: number, notes: string) {
    const payment = this.paymentRepository.create({
      userId,
      amount,
      currency: 'INR',
      orderId: `CASH_SUB_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: 'pending_verification',
      attributes: { imei, method: 'cash', type: 'client_submitted', notes }
    });
    return this.paymentRepository.save(payment);
  }

  async verifyCashPayment(paymentId: string, status: string) {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!payment) throw new BadRequestException('Transaction not found');

    payment.status = status; // 'captured' or 'rejected'
    await this.paymentRepository.save(payment);

    if (status === 'captured') {
        const imei = (payment.attributes as any).imei;
        const planSlug = '1month'; // Default for manual cash if not specified, or parse from notes
        await this.subscriptionsService.extendSubscription(imei, planSlug);
    }
    return { success: true };
  }
}
