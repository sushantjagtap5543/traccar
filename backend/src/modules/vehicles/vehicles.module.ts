import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { ApprovedDevice } from './entities/approved-device.entity';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { TraccarModule } from '../traccar/traccar.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle, ApprovedDevice]),
    TraccarModule,
  ],
  providers: [VehiclesService],
  controllers: [VehiclesController],
  exports: [VehiclesService],
})
export class VehiclesModule {}
