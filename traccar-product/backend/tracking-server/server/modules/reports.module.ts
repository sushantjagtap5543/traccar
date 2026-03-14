import { Module } from '@nestjs/common';
import { ReportsService } from '../../src/services/reports.service';
import { ReportsController } from '../../src/api/reports.controller';
import { TraccarModule } from './traccar.module';
import { DevicesModule } from './devices.module';

@Module({
  imports: [TraccarModule, DevicesModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
