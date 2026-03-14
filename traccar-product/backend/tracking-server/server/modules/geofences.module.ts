import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Geofence } from '../../src/database/entities/geofence.entity';
import { GeofencesService } from '../../src/services/geofences.service';
import { GeofencesController } from '../../src/api/geofences.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Geofence])],
  controllers: [GeofencesController],
  providers: [GeofencesService],
  exports: [GeofencesService],
})
export class GeofencesModule {}
