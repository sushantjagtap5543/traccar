import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from '../database/entities/driver.entity';
import { AlertRule } from '../database/entities/alert-rule.entity';
import { Device } from '../database/entities/device.entity';
import { TacticalExpense } from '../database/entities/tactical-expense.entity';
import { TacticalDocument } from '../database/entities/tactical-document.entity';
import { RouteGeofence } from '../database/entities/route-geofence.entity';
import { TacticalController } from '../api/tactical.controller';
import { TacticalService } from '../services/tactical.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Driver, AlertRule, Device, TacticalExpense, TacticalDocument, RouteGeofence]),
  ],
  controllers: [TacticalController],
  providers: [TacticalService],
  exports: [TacticalService],
})
export class TacticalModule {}
