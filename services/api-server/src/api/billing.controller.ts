import { Controller, Post, Get, Body, UseGuards, Req, Param, BadRequestException } from '@nestjs/common';
import { BillingService } from '../services/billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Plan } from '../database/entities/plan.entity';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get available subscription plans' })
  async getPlans() {
    return this.billingService.getPlans();
  }

  @Post('plans/:id')
  @ApiOperation({ summary: 'Update plan details (Admin Only)' })
  async updatePlan(@Req() req, @Param('id') id: string, @Body() body: Partial<Plan>) {
    if (!req.user.administrator) throw new BadRequestException('Unauthorized tactical access');
    return this.billingService.updatePlan(id, body);
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

  @Post('cash-record')
  @ApiOperation({ summary: 'Record an offline cash payment (Admin Only)' })
  async recordCash(@Req() req, @Body() body: { userId: string, imei: string, planSlug: string }) {
    if (!req.user.administrator) throw new BadRequestException('Unauthorized tactical access');
    return this.billingService.recordCashPayment(req.user.id, body.userId, body.imei, body.planSlug);
  }

  @Post('client/cash-record')
  @ApiOperation({ summary: 'Client report of an offline cash payment' })
  async clientRecordCash(@Req() req, @Body() body: { imei: string, amount: number, notes: string }) {
    return this.billingService.clientSubmitCashRecord(req.user.id, body.imei, body.amount, body.notes);
  }

  @Post('admin/cash-verify/:id')
  @ApiOperation({ summary: 'Admin verification of cash payment' })
  async verifyCashPayment(@Req() req, @Param('id') id: string, @Body('status') status: string) {
    if (!req.user.administrator) throw new BadRequestException('High-Command access required');
    return this.billingService.verifyCashPayment(id, status);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get user payment history' })
  async getHistory(@Req() req) {
    return this.billingService.getHistory(req.user.id);
  }
}
