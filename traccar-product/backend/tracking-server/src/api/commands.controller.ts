import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CommandsService } from '../services/commands.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Commands')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('commands')
export class CommandsController {
  constructor(private readonly commandsService: CommandsService) {}

  @Post(':vehicleId/ignition')
  @ApiOperation({ summary: 'Send Ignition ON/OFF command' })
  async sendIgnition(@Req() req, @Param('vehicleId') vehicleId: string, @Body('state') state: boolean) {
    return this.commandsService.sendIgnitionCommand(req.user.userId, vehicleId, state);
  }

  @Get(':vehicleId/logs')
  @ApiOperation({ summary: 'Get command history for a vehicle' })
  async getLogs(@Req() req, @Param('vehicleId') vehicleId: string) {
    return this.commandsService.getLogs(req.user.userId, vehicleId);
  }
}
