import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { ApprovedDevice } from './entities/approved-device.entity';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { TraccarModule } from '../traccar/traccar.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, ApprovedDevice]),
    TraccarModule,
  ],
  providers: [DevicesService],
  controllers: [DevicesController],
  exports: [DevicesService],
})
export class DevicesModule {}
