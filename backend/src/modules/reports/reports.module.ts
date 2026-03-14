import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { TraccarModule } from '../traccar/traccar.module';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [TraccarModule, DevicesModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
