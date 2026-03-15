import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandLog } from './entities/command-log.entity';
import { CommandsService } from './commands.service';
import { CommandsController } from './commands.controller';
import { TraccarModule } from '../traccar/traccar.module';
import { VehiclesModule } from '../vehicles/vehicles.module';

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
