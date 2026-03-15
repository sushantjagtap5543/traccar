import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandLog } from '../database/entities/command-log.entity';
import { CommandsService } from '../services/commands.service';
import { CommandsController } from '../api/commands.controller';
import { TraccarModule } from './traccar.module';
import { DevicesModule } from './devices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommandLog]),
    TraccarModule,
    VehiclesModule,
  ],
  providers: [CommandsService],
  controllers: [CommandsController],
  exports: [CommandsService],
})
export class CommandsModule {}
