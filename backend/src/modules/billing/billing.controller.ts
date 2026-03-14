import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('order')
  @ApiOperation({ summary: 'Create a new payment order' })
  async createOrder(@Req() req, @Body() body: { amount: number }) {
    return this.billingService.createOrder(req.user.id, body.amount);
  }

  @Post('capture')
  @ApiOperation({ summary: 'Capture a successful payment' })
  async capturePayment(@Req() req, @Body() body: { orderId: string, paymentId: string }) {
    return this.billingService.capturePayment(req.user.id, body.orderId, body.paymentId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get user payment history' })
  async getHistory(@Req() req) {
    return this.billingService.getHistory(req.user.id);
  }
}
