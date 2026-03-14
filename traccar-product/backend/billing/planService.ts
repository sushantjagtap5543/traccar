import { Injectable } from '@nestjs/common';

@Injectable()
export class PlanService {
  private plans = [
    { id: 1, name: 'Basic', price: 200, deviceLimit: 5, durationMonths: 1 },
    { id: 2, name: 'Standard', price: 950, deviceLimit: 10, durationMonths: 6 },
    { id: 3, name: 'Premium', price: 1500, deviceLimit: 20, durationMonths: 12 },
  ];

  async getAllPlans() {
    return this.plans;
  }

  async getPlanById(id: number) {
    return this.plans.find(p => p.id === id);
  }
}
