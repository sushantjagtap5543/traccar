import { Controller, Get, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { AuditService } from '../services/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Get all system audit logs (Admin)' })
  async findAll(@Req() req) {
    if (req.user.role !== 'admin' && !req.user.administrator) {
        throw new BadRequestException('Security Protocol: Audit access restricted to High-Command (Admin) only.');
    }
    return this.auditService.findAll();
  }
}
