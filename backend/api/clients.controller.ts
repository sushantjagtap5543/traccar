import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new client (Admin only)' })
  create(@Body() data: { name: string; email?: string }) {
    return this.clientsService.create(data.name, data.email);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all clients (Admin only)' })
  findAll() {
    return this.clientsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client details' })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }
}
