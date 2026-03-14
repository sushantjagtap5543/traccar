import { Controller, Post, Get, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new GeoSurePath device' })
  async register(@Req() req, @Body() data: { name: string; imei: string; model?: string }) {
    return this.vehiclesService.register(req.user.userId, data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vehicles for the current user' })
  async findAll(@Req() req) {
    return this.vehiclesService.findAllByUser(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific vehicle' })
  async findOne(@Req() req, @Param('id') id: string) {
    return this.vehiclesService.findOne(id, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a vehicle' })
  async remove(@Req() req, @Param('id') id: string) {
    return this.vehiclesService.remove(id, req.user.userId);
  }
}
