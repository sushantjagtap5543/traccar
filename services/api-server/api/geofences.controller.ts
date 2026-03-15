import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { GeofencesService } from '../services/geofences.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Geofences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('geofences')
export class GeofencesController {
  constructor(private readonly geofencesService: GeofencesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new geofence' })
  create(@Req() req, @Body() data: any) {
    return this.geofencesService.create(req.user.userId, data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all geofences for the user' })
  findAll(@Req() req) {
    return this.geofencesService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific geofence' })
  findOne(@Req() req, @Param('id') id: string) {
    return this.geofencesService.findOne(id, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a geofence' })
  remove(@Req() req, @Param('id') id: string) {
    return this.geofencesService.remove(id, req.user.userId);
  }
}
