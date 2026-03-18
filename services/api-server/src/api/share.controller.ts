import { Controller, Post, Get, Body, Param, UseGuards, Req, Query, NotFoundException } from '@nestjs/common';
import { ShareService } from '../services/share.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TraccarService } from '../services/traccar.service';
import { DevicesService } from '../services/devices.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Strategic Sharing')
@Controller('share')
export class ShareController {
  constructor(
    private readonly shareService: ShareService,
    private readonly traccarService: TraccarService,
    private readonly devicesService: DevicesService,
  ) {}

  @Post(':deviceId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create an expiring tracking link' })
  async create(@Req() req, @Param('deviceId') deviceId: string, @Body('hours') hours: number) {
    return this.shareService.createToken(req.user.userId, deviceId, hours || 1);
  }

  @Get(':deviceId/active')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List active sharing tokens for a device' })
  async getActive(@Req() req, @Param('deviceId') deviceId: string) {
    return this.shareService.getActiveTokens(req.user.userId, deviceId);
  }

  @Get('portal/:code')
  @ApiOperation({ summary: 'Access an expiring tracking portal (Public)' })
  async accessPortal(@Param('code') code: string) {
    const token = await this.shareService.validateToken(code);
    const device = await this.devicesService.findOne(token.deviceId);
    
    // Get latest position
    const positions = await this.traccarService.getLatestPositions([device.traccarDeviceId]);
    if (!positions || positions.length === 0) throw new NotFoundException('Asset signal currently inactive');

    return {
      deviceName: device.name,
      lastPosition: positions[0],
      expiresAt: token.expiresAt
    };
  }
}
