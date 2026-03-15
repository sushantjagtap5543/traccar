import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { SubscriptionsService } from '../services/subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get(':imei')
  @ApiOperation({ summary: 'Get subscription status for a device' })
  async getSubscription(@Param('imei') imei: string) {
    return this.subscriptionsService.getSubscription(imei);
  }

  @Get()
  @ApiOperation({ summary: 'Admin: Get all subscriptions' })
  async findAll() {
    // In a real app, this would be admin protected
    return this.subscriptionsService.findAll();
  }
}
