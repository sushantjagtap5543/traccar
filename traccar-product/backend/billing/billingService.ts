import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from '../tracking-server/src/database/entities/plan.entity';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
  ) {}

  async createPlan(data: any) {
    const plan = this.planRepository.create(data);
    return await this.planRepository.save(plan);
  }

  async getPlans() {
    return await this.planRepository.find();
  }

  async processPayment(paymentData: any) {
    // Logic to interface with payment gateway
    // This will be expanded in PaymentService
  }
}
