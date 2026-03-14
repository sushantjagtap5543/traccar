import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../tracking-server/src/database/entities/invoice.entity';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
  ) {}

  async generateInvoice(subscriptionId: number, amount: number) {
    const invoice = this.invoiceRepository.create({
      subscriptionId,
      amount,
      status: 'pending',
    });

    return await this.invoiceRepository.save(invoice);
  }

  async getInvoiceById(id: number) {
    return await this.invoiceRepository.findOne({ where: { id } });
  }
}
