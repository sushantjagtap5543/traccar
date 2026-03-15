import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../../database/entities/event.entity';
import { AlertsService } from '../../services/alerts.service';
import { AlertsController } from '../../api/alerts.controller';
import { PositionsModule } from './positions.module';
import { GeofencesModule } from './geofences.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
    forwardRef(() => PositionsModule),
    GeofencesModule,
  ],
  providers: [AlertsService],
  controllers: [AlertsController],
  exports: [AlertsService],
})
export class AlertsModule {}
