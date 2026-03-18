import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../database/entities/payment.entity';
import { User } from '../database/entities/user.entity';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async generateInvoiceData(paymentId: string) {
    const payment = await this.paymentRepository.findOne({ 
      where: { id: paymentId },
      relations: ['user']
    });

    if (!payment) throw new Error('Payment record not found');

    return {
      invoiceNumber: `INV-${payment.orderId}`,
      date: payment.createdAt,
      customer: {
        name: payment.user?.name || 'Tactical Operative',
        email: payment.user?.email || 'N/A',
      },
      items: [
        {
          description: `Subscription Renewal - ${payment.attributes?.planId || 'Standard'}`,
          amount: payment.amount,
          currency: payment.currency
        }
      ],
      totals: {
        subtotal: payment.amount,
        tax: payment.amount * 0.18, // 18% GST simulation
        total: payment.amount * 1.18
      },
      status: payment.status
    };
  }
}
