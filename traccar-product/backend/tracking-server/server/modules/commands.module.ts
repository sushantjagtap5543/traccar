import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandLog } from '../../src/database/entities/command-log.entity';
import { CommandsService } from '../../src/services/commands.service';
import { CommandsController } from '../../src/api/commands.controller';
import { TraccarModule } from './traccar.module';
import { DevicesModule } from './devices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommandLog]),
    TraccarModule,
    DevicesModule,
  ],
  providers: [CommandsService],
  controllers: [CommandsController],
  exports: [CommandsService],
})
export class CommandsModule {}
