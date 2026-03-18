import { Controller, Post, Get, Body, Param, UseGuards, Req, Delete, Patch } from '@nestjs/common';
import { TacticalService } from '../services/tactical.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Tactical Operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tactical')
export class TacticalController {
  constructor(private readonly tacticalService: TacticalService) {}

  // --- DRIVER GOVERNANCE ---
  @Get('drivers')
  @ApiOperation({ summary: 'Get all drivers for client' })
  async getDrivers(@Req() req) {
    return this.tacticalService.getDrivers(req.user.clientId);
  }

  @Post('drivers')
  @ApiOperation({ summary: 'Create a new driver profile' })
  async createDriver(@Req() req, @Body() data: any) {
    return this.tacticalService.createDriver(req.user.clientId, data);
  }

  @Patch('drivers/:id')
  @ApiOperation({ summary: 'Update driver profile' })
  async updateDriver(@Param('id') id: string, @Body() data: any) {
    return this.tacticalService.updateDriver(id, data);
  }

  @Delete('drivers/:id')
  @ApiOperation({ summary: 'Delete driver profile' })
  async deleteDriver(@Param('id') id: string) {
    return this.tacticalService.deleteDriver(id);
  }

  @Post('assets/:deviceId/assign/:driverId')
  @ApiOperation({ summary: 'Bind driver to asset' })
  async assignDriver(@Param('deviceId') deviceId: string, @Param('driverId') driverId: string) {
    return this.tacticalService.assignDriver(deviceId, driverId === 'null' ? null : driverId);
  }

  // --- FINANCIAL INTEL (EXPENSES) ---
  @Get('expenses/:deviceId')
  @ApiOperation({ summary: 'Get asset expense history' })
  async getExpenses(@Req() req, @Param('deviceId') deviceId: string) {
    return this.tacticalService.getExpenses(req.user.userId, deviceId);
  }

  @Post('expenses/:deviceId')
  @ApiOperation({ summary: 'Record asset expense' })
  async addExpense(@Req() req, @Param('deviceId') deviceId: string, @Body() data: any) {
    return this.tacticalService.addExpense(req.user.userId, { ...data, deviceId });
  }

  // --- DOCUMENT VAULT ---
  @Get('documents/:deviceId')
  @ApiOperation({ summary: 'Get asset compliance documents' })
  async getDocuments(@Req() req, @Param('deviceId') deviceId: string) {
    return this.tacticalService.getDocuments(req.user.userId, deviceId);
  }

  @Post('documents/:deviceId')
  @ApiOperation({ summary: 'Vault asset compliance document' })
  async addDocument(@Req() req, @Param('deviceId') deviceId: string, @Body() data: any) {
    return this.tacticalService.addDocument(req.user.userId, { ...data, deviceId });
  }

  // --- ROUTE GEOFENCING ---
  @Get('route-geofences/:deviceId')
  @ApiOperation({ summary: 'Get asset route geofences' })
  async getRouteGeofences(@Req() req, @Param('deviceId') deviceId: string) {
    return this.tacticalService.getRouteGeofences(req.user.userId, deviceId);
  }

  @Post('route-geofences/:deviceId')
  @ApiOperation({ summary: 'Establish route-based containment' })
  async addRouteGeofence(@Req() req, @Param('deviceId') deviceId: string, @Body() data: any) {
    return this.tacticalService.addRouteGeofence(req.user.userId, { ...data, deviceId });
  }

  @Get('export/:deviceId')
  @ApiOperation({ summary: 'Generate tactical telemetry export' })
  async exportData(@Param('deviceId') deviceId: string) {
    return this.tacticalService.getExportData(deviceId);
  }
}
