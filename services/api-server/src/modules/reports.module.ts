import { Module } from '@nestjs/common';
import { ReportsService } from '../../services/reports.service';
import { ReportsController } from '../../api/reports.controller';
import { TraccarModule } from './traccar.module';
import { DevicesModule } from './devices.module';

@Module({
  imports: [TraccarModule, DevicesModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
