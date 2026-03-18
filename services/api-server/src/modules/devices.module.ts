import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from '../database/entities/device.entity';
import { ApprovedDevice } from '../database/entities/approved-device.entity';
import { Permission } from '../database/entities/permission.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { HardwareWhitelist } from '../database/entities/hardware-whitelist.entity';
import { DevicesService } from '../services/devices.service';
import { DevicesController } from '../api/devices.controller';
import { TraccarModule } from './traccar.module';
import { SubscriptionsModule } from './subscriptions.module';
import { UsersModule } from './users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, ApprovedDevice, Permission, AuditLog, HardwareWhitelist]),
    TraccarModule,
    SubscriptionsModule,
    UsersModule,
  ],
  providers: [DevicesService],
  controllers: [DevicesController],
  exports: [DevicesService],
})
export class DevicesModule {}
