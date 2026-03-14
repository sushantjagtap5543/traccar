import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { Device } from '../devices/entities/device.entity';
import { Client } from '../clients/entities/client.entity';
import { Alert } from '../alerts/entities/alert.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Device, Client, Alert])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
