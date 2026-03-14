import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../tracking-server/src/database/entities/subscription.entity';
import { Plan } from '../tracking-server/src/database/entities/plan.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
  ) {}

  async activateSubscription(clientId: number, planId: number) {
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.durationDays);

    const subscription = this.subscriptionRepository.create({
      clientId,
      planId,
      startDate,
      endDate,
      status: 'active',
    });

    return await this.subscriptionRepository.save(subscription);
  }

  async extendSubscription(subscriptionId: number, durationInDays: number) {
    const subscription = await this.subscriptionRepository.findOne({ where: { id: subscriptionId } });
    if (!subscription) throw new Error('Subscription not found');

    subscription.endDate.setDate(subscription.endDate.getDate() + durationInDays);
    return await this.subscriptionRepository.save(subscription);
  }

  async checkStatus(clientId: number) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { clientId, status: 'active' },
      order: { endDate: 'DESC' },
    });

    if (!subscription || subscription.endDate < new Date()) {
      return { active: false };
    }

    return { active: true, subscription };
  }
}
