import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from './entities/alert.entity';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { TelemetryModule } from '../telemetry/telemetry.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alert]),
    TelemetryModule,
  ],
  providers: [AlertsService],
  controllers: [AlertsController],
  exports: [AlertsService],
})
export class AlertsModule {}
