class SubscriptionService {
  async activateSubscription(userId, planId) {
    console.log(`Activating plan ${planId} for user ${userId}`);
    return {
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
  }

  async checkLimit(currentDeviceCount, deviceLimit) {
    return currentDeviceCount < deviceLimit;
  }
}

module.exports = new SubscriptionService();
