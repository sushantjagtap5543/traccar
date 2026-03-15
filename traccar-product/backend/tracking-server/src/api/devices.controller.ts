import { Controller, Post, Get, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { DevicesService } from '../services/devices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new GeoSurePath device' })
  async register(@Req() req, @Body() data: { name: string; imei: string; model?: string }) {
    return this.devicesService.register(req.user.userId, data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all devices for the current user' })
  async findAll(@Req() req) {
    return this.devicesService.findByUser(req.user.userId, req.user.clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific device' })
  async findOne(@Req() req, @Param('id') id: string) {
    return this.devicesService.findOne(id, req.user.userId, req.user.clientId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a device' })
  async remove(@Req() req, @Param('id') id: string) {
    return this.devicesService.remove(id, req.user.userId);
  }
}
