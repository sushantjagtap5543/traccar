import { Injectable, ForbiddenException } from '@nestjs/common';
import { TraccarService } from '../traccar/traccar.service';
import { DevicesService } from '../devices/devices.service';

@Injectable()
export class ReportsService {
  constructor(
    private traccarService: TraccarService,
    private devicesService: DevicesService,
  ) {}

  async getTrips(userId: string, clientId: string, deviceId: string, from: string, to: string) {
    const device = await this.devicesService.findOne(deviceId, userId, clientId);
    if (!device.traccarDeviceId) return [];
    
    return this.traccarService.getTripReport(device.traccarDeviceId, from, to);
  }

  async getStops(userId: string, clientId: string, deviceId: string, from: string, to: string) {
    const device = await this.devicesService.findOne(deviceId, userId, clientId);
    if (!device.traccarDeviceId) return [];
    
    return this.traccarService.getStopReport(device.traccarDeviceId, from, to);
  }

  async getSummary(userId: string, clientId: string, deviceId: string, from: string, to: string) {
    const device = await this.devicesService.findOne(deviceId, userId, clientId);
    if (!device.traccarDeviceId) return [];
    
    return this.traccarService.getSummaryReport(device.traccarDeviceId, from, to);
  }
}
