import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('trips')
  @ApiOperation({ summary: 'Get trip report for a device' })
  async getTrips(
    @Req() req,
    @Query('deviceId') deviceId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportsService.getTrips(req.user.userId, req.user.clientId, deviceId, from, to);
  }

  @Get('stops')
  @ApiOperation({ summary: 'Get stop report for a device' })
  async getStops(
    @Req() req,
    @Query('deviceId') deviceId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportsService.getStops(req.user.userId, req.user.clientId, deviceId, from, to);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get summary report for a device' })
  async getSummary(
    @Req() req,
    @Query('deviceId') deviceId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportsService.getSummary(req.user.userId, req.user.clientId, deviceId, from, to);
  }
}
