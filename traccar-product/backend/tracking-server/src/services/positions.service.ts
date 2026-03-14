import { Injectable, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { PositionsGateway } from '../../server/modules/positions.gateway';
import { TraccarService } from './traccar.service';
import { DevicesService } from './devices.service';
import { AlertsService } from './alerts.service';
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
      // Optmization: Potentially fetch only active devices from DB first?
      // For now, we continue fetching all but ensure cleanup of stale data.
      const positions = await this.traccarService.getLatestPositions([]); 
      const now = Date.now();
      
      for (const pos of positions) {
        const device = await this.devicesService.findByTraccarId(pos.deviceId);
        if (device) {
          this.lastUpdate.set(device.id, now);
          this.offlineAlertsSent.delete(device.id);

          if (device.clientId) {
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

          // Trigger business rules (Alerts)
          await this.alertsService.processTelemetry(device.id, pos, device.userId, device.clientId);
        }
      }

      // Check for offline devices and cleanup stale tracking data
      await this.checkOfflineAndCleanup(now);
    } catch (e) {
      console.error('Position polling error:', e.message);
    }
  }

  private async checkOfflineAndCleanup(now: number) {
    const offlineThreshold = this.configService.get<number>('OFFLINE_THRESHOLD') || 300000; // 5 minutes
    const cleanupThreshold = 24 * 60 * 60 * 1000; // 24 hours of inactivity
    
    for (const [deviceId, lastSeen] of this.lastUpdate.entries()) {
      // 1. Alert if offline
      if (now - lastSeen > offlineThreshold && !this.offlineAlertsSent.has(deviceId)) {
        const device = await this.devicesService.findOne(deviceId);
        if (device) {
          await this.alertsService.createOfflineAlert(deviceId, device.userId, device.clientId);
          this.offlineAlertsSent.add(deviceId);
        }
      }

      // 2. Cleanup stale data to prevent memory leaks
      if (now - lastSeen > cleanupThreshold) {
        this.lastUpdate.delete(deviceId);
        this.offlineAlertsSent.delete(deviceId);
      }
    }
  }
}
