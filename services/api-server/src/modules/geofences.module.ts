import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Geofence } from '../../database/entities/geofence.entity';
import { GeofencesService } from '../../services/geofences.service';
import { GeofencesController } from '../../api/geofences.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Geofence])],
  controllers: [GeofencesController],
  providers: [GeofencesService],
  exports: [GeofencesService],
})
export class GeofencesModule {}
