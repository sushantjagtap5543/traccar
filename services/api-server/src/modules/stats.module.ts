import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsService } from '../../services/stats.service';
import { StatsController } from '../../api/stats.controller';
import { Device } from '../../database/entities/device.entity';
import { User } from '../../database/entities/user.entity';
import { Event } from '../../database/entities/event.entity';
import { TraccarModule } from './traccar.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, User, Event]),
    TraccarModule
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
