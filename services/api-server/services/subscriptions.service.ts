import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../database/entities/subscription.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  async createFreeSubscription(imei: string): Promise<Subscription> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + 1);

    const subscription = this.subscriptionRepository.create({
      imei,
      startDate,
      endDate,
      status: 'active',
    });

    return this.subscriptionRepository.save(subscription);
  }

  async getSubscription(imei: string): Promise<Subscription> {
    return this.subscriptionRepository.findOne({ where: { imei } });
  }

  async extendSubscription(imei: string, planId: string): Promise<Subscription> {
    const subscription = await this.getSubscription(imei);
    if (!subscription) throw new Error('Subscription not found');

    const months = planId === '1month' ? 1 : (planId === '6month' ? 6 : 12);
    const newEndDate = new Date(subscription.endDate);
    if (newEndDate < new Date()) {
      newEndDate.setTime(Date.now());
    }
    newEndDate.setMonth(newEndDate.getMonth() + months);

    subscription.endDate = newEndDate;
    subscription.status = 'active';
    return this.subscriptionRepository.save(subscription);
  }

  async findAll(): Promise<Subscription[]> {
    return this.subscriptionRepository.find({ order: { endDate: 'DESC' } });
  }
}
