import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { StatsService } from '../services/stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../database/entities/user-role.enum';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  getAdminStats() {
    return this.statsService.getAdminStats();
  }

  @Get('user')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Get user dashboard stats' })
  getUserStats(@Req() req) {
    return this.statsService.getUserStats(req.user.userId);
  }
}
