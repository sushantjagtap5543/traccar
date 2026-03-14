import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsService } from '../../src/services/stats.service';
import { StatsController } from '../../src/api/stats.controller';
import { Device } from '../../src/database/entities/device.entity';
import { Client } from '../../src/database/entities/client.entity';
import { Alert } from '../../src/database/entities/alert.entity';
import { TraccarModule } from './traccar.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, Client, Alert]),
    TraccarModule
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
