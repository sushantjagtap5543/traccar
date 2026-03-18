import { Controller, Get, Post, Body, UseGuards, Query, BadRequestException, Req } from '@nestjs/common';
import { SettingsService } from '../services/settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all system settings (Publicly available to logged users)' })
  async getAll(@Query('category') category: string) {
    return this.settingsService.getAllByType(category);
  }

  @Post()
  @ApiOperation({ summary: 'Update system settings (Admin Only)' })
  async update(@Req() req, @Body() data: { key: string, value: string, category: string }) {
    if (!req.user.administrator) throw new BadRequestException('Unauthorized strategic access');
    return this.settingsService.set(data.key, data.value, data.category);
  }
}
