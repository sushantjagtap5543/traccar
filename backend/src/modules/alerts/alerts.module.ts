import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from './entities/alert.entity';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { PositionsModule } from '../positions/positions.module';
import { GeofencesModule } from '../geofences/geofences.module';

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
