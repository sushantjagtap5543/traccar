import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';

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

  async findAll(): Promise<Subscription[]> {
    return this.subscriptionRepository.find({ order: { endDate: 'DESC' } });
  }
}
