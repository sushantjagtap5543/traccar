import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PositionsGateway } from './positions.gateway';
import { TraccarService } from '../traccar/traccar.service';
import { DevicesService } from '../devices/devices.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PositionsService implements OnModuleInit, OnModuleDestroy {
  private pollingInterval: NodeJS.Timeout;

  constructor(
    private positionsGateway: PositionsGateway,
    private traccarService: TraccarService,
    private devicesService: DevicesService,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    const interval = this.configService.get<number>('POLLING_INTERVAL') || 10000;
    this.pollingInterval = setInterval(() => this.pollTraccar(), interval);
  }

  onModuleDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  private async pollTraccar() {
    try {
      const positions = await this.traccarService.getLatestPositions([]); 
      
      for (const pos of positions) {
        const device = await this.devicesService.findByTraccarId(pos.deviceId);
        if (device && device.clientId) {
          this.positionsGateway.broadcastToClient(device.clientId, 'position_update', {
            deviceId: device.id,
            latitude: pos.latitude,
            longitude: pos.longitude,
            speed: pos.speed,
            course: pos.course,
            attributes: pos.attributes,
            serverTime: pos.serverTime,
          });
        }
      }
    } catch (e) {
      console.error('Position polling error:', e.message);
    }
  }
}
