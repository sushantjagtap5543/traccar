import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { AlertsService } from '../services/alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Get recent alerts for the user' })
  async findAll(@Req() req) {
    return this.alertsService.findAllByUser(req.user.userId, req.user.clientId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark alert as read' })
  async markAsRead(@Param('id') id: string) {
    await this.alertsService.markAsRead(id);
    return { success: true };
  }
}
