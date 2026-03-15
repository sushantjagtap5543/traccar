import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from '../../src/database/entities/device.entity';
import { ApprovedDevice } from '../../src/database/entities/approved-device.entity';
import { DevicesService } from '../../src/services/devices.service';
import { DevicesController } from '../../src/api/devices.controller';
import { TraccarModule } from './traccar.module';
import { SubscriptionsModule } from './subscriptions.module';
import { UsersModule } from './users.module';

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
