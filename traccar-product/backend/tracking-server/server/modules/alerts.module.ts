import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from '../../src/database/entities/alert.entity';
import { AlertsService } from '../../src/services/alerts.service';
import { AlertsController } from '../../src/api/alerts.controller';
import { PositionsModule } from './positions.module';
import { GeofencesModule } from './geofences.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alert]),
    forwardRef(() => PositionsModule),
    GeofencesModule,
  ],
  providers: [AlertsService],
  controllers: [AlertsController],
  exports: [AlertsService],
})
export class AlertsModule {}
