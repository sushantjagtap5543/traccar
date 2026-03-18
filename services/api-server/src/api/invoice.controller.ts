import { Controller, Get, Param, UseGuards, Req, Res } from '@nestjs/common';
import { InvoiceService } from '../services/invoice.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get(':paymentId')
  @ApiOperation({ summary: 'Get automated invoice data' })
  async getInvoice(@Req() req, @Param('paymentId') paymentId: string) {
    return this.invoiceService.generateInvoiceData(paymentId);
  }
}
