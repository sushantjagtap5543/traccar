class BillingService {
  constructor() {
    this.plans = [
      { id: 1, name: 'Basic', price: 200.00, deviceLimit: 5 },
      { id: 2, name: 'Standard', price: 950.00, deviceLimit: 10 },
      { id: 3, name: 'Premium', price: 1500.00, deviceLimit: 20 }
    ];
  }

  async getPlans() {
    return this.plans;
  }

  async calculateTotal(planId, taxRate = 0.18) {
    const plan = this.plans.find(p => p.id === planId);
    if (!plan) throw new Error('Plan not found');
    const tax = plan.price * taxRate;
    return { subtotal: plan.price, tax, total: plan.price + tax };
  }
}

module.exports = new BillingService();
