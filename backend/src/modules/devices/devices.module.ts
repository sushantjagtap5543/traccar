import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { ApprovedDevice } from './entities/approved-device.entity';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { TraccarModule } from '../traccar/traccar.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, ApprovedDevice]),
    TraccarModule,
    SubscriptionsModule,
    UsersModule,
  ],
  providers: [DevicesService],
  controllers: [DevicesController],
  exports: [DevicesService],
})
export class DevicesModule {}
