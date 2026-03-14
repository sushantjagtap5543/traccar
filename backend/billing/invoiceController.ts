import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('invoices')
// @UseGuards(JwtAuthGuard)
export class InvoiceController {
  @Post('generate')
  async generateInvoice(@Body() data: any) {
    return { message: 'Invoice generated successfully' };
  }

  @Get(':id')
  async getInvoice(@Param('id') id: string) {
    return { id, status: 'unpaid', amount: 0 };
  }

  @Get('client/:clientId')
  async getClientInvoices(@Param('clientId') clientId: string) {
    return [];
  }
}
