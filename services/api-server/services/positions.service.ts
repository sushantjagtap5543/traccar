import { Injectable, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { PositionsGateway } from '../server/modules/positions.gateway';
import { TraccarService } from './traccar.service';
import { DevicesService } from './devices.service';
import { AlertsService } from './alerts.service';
import { PermissionsService } from './permissions.service'; // Assuming we need this or access repo directly
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PositionsService implements OnModuleInit, OnModuleDestroy {
  private pollingInterval: NodeJS.Timeout;
  private lastUpdate = new Map<string, number>();
  private offlineAlertsSent = new Set<string>();

  constructor(
    private positionsGateway: PositionsGateway,
    private traccarService: TraccarService,
    private devicesService: DevicesService,
    private configService: ConfigService,
    @Inject(forwardRef(() => AlertsService))
    private alertsService: AlertsService,
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
      const now = Date.now();
      
      for (const pos of positions) {
        const device = await this.devicesService.findOneByTraccarId(pos.deviceId);
        if (device) {
          this.lastUpdate.set(device.id, now);
          this.offlineAlertsSent.delete(device.id);

          // Get all users who have access to this device
          const devicesWithUsers = await this.devicesService.getDeviceUsers(device.id);
          
          for (const userId of devicesWithUsers) {
            this.positionsGateway.broadcastToUser(userId, 'position_update', {
              deviceId: device.id,
              latitude: pos.latitude,
              longitude: pos.longitude,
              speed: pos.speed,
              course: pos.course,
              attributes: pos.attributes,
              serverTime: pos.serverTime,
            });
          }

          // Trigger business rules (Alerts)
          // We don't need to pass userId here if processTelemetry handles finding all relevant users or if it just creates an event
          await this.alertsService.processTelemetry(device.id, pos);
        }
      }

      // Check for offline devices
      await this.checkOffline(now);
    } catch (e) {
      console.error('Position polling error:', e.message);
    }
  }

  private async checkOffline(now: number) {
    const offlineThreshold = this.configService.get<number>('OFFLINE_THRESHOLD') || 300000; // 5 minutes
    
    for (const [deviceId, lastSeen] of this.lastUpdate.entries()) {
      if (now - lastSeen > offlineThreshold && !this.offlineAlertsSent.has(deviceId)) {
        await this.alertsService.createOfflineAlert(deviceId);
        this.offlineAlertsSent.add(deviceId);
      }
    }
  }
}

