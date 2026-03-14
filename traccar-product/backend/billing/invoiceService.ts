import { Injectable } from '@nestjs/common';

@Injectable()
export class InvoiceService {
  async generateInvoice(clientId: string, plan: any) {
    const invoiceId = \INV-\\;
    return {
      invoiceId,
      clientId,
      amount: plan.price,
      tax: plan.price * 0.18,
      total: plan.price * 1.18,
      status: 'unpaid',
      createdAt: new Date().toISOString(),
    };
  }
}
