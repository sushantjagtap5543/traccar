import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { BillingService } from '../services/billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get all billing plans' })
  async getPlans() {
    return await this.billingService.getPlans();
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create a new billing plan' })
  async createPlan(@Body() planData: any) {
    return await this.billingService.createPlan(planData);
  }

  @Post('order')
  @ApiOperation({ summary: 'Create a new payment order' })
  async createOrder(@Req() req, @Body() body: { planId: string }) {
    return this.billingService.createOrder(req.user.id, body.planId);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify and capture a successful payment' })
  async verifyPayment(@Req() req, @Body() body: { razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string, imei: string }) {
    return this.billingService.verifyPayment(req.user.id, body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature, body.imei);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get user payment history' })
  async getHistory(@Req() req) {
    return this.billingService.getHistory(req.user.id);
  }
}
