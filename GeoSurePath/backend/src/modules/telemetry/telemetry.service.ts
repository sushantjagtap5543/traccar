import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TelemetryGateway } from './telemetry.gateway';
import { TraccarService } from '../traccar/traccar.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelemetryService implements OnModuleInit, OnModuleDestroy {
  private pollingInterval: NodeJS.Timeout;

  constructor(
    private telemetryGateway: TelemetryGateway,
    private traccarService: TraccarService,
    private vehiclesService: VehiclesService,
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
    // This is a simplified polling logic.
    // In a high-scale production app, we would use Traccar's WebSocket or forward feature.
    try {
      // 1. Get all active users (or just active connections)
      // For this free edition, we'll keep it simple and broadcast to all connected users
      // based on their registered devices.
      
      // Note: Ideally, we fetch positions for all devices and filter by user.
      // Here we'll simulate the broadcast.
      
      // Fetching all devices from Traccar might be heavy, so we'd usually fetch per active user.
      // For now, let's assume we fetch positions and broadcast.
      const positions = await this.traccarService.getLatestPositions([]); // Empty array usually gets all or we pass IDs
      
      // Group positions by device and broadcast to the users who own them
      // In a real implementation, we'd have a mapping of traccarDeviceId -> userId
      
      // For demonstration:
      // positions.forEach(pos => {
      //    const userId = getUserIdByTraccarId(pos.deviceId);
      //    this.telemetryGateway.broadcastToUser(userId, 'position_update', pos);
      // });
    } catch (e) {
      console.error('Telemetry polling error:', e.message);
    }
  }
}
