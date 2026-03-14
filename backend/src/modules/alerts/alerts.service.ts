import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './entities/alert.entity';
import { PositionsGateway } from '../positions/positions.gateway';
import { GeofencesService } from '../geofences/geofences.service';

@Injectable()
export class AlertsService {
  private lastIgnitionState = new Map<string, boolean>();
  private lastGeofenceState = new Map<string, Record<string, boolean>>();

  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    @Inject(forwardRef(() => PositionsGateway))
    private positionsGateway: PositionsGateway,
    private geofencesService: GeofencesService,
  ) {}

  async processTelemetry(deviceId: string, telemetry: any, userId: string, clientId?: string) {
    const alertsToCreate: Partial<Alert>[] = [];
    
    // 1. Overspeed
    if (telemetry.speed > (telemetry.speedLimit || 80)) {
       // Logic to avoid spamming speed alerts (e.g., once every 5 minutes)
       alertsToCreate.push({ type: 'overspeed', message: `Vehicle exceeded speed limit: ${Math.round(telemetry.speed)} km/h`, deviceId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    // 2. Power Cut
    if (telemetry.attributes?.alarm === 'powerCut') {
      alertsToCreate.push({ type: 'power_cut', message: 'Main power supply disconnected', deviceId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    // 3. Vibration
    if (telemetry.attributes?.alarm === 'vibration') {
      alertsToCreate.push({ type: 'vibration', message: 'Vibration detected while parked', deviceId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    // 4. Tow
    if (telemetry.attributes?.alarm === 'tow') {
      alertsToCreate.push({ type: 'tow', message: 'Vehicle is being towed', deviceId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    // 5. Low Battery
    if (telemetry.attributes?.batteryLevel < 20) {
      alertsToCreate.push({ type: 'low_battery', message: `Device battery is low (${telemetry.attributes.batteryLevel}%)`, deviceId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    // 6. Ignition Change (State aware)
    const currentIgnition = telemetry.attributes?.ignition;
    if (currentIgnition !== undefined) {
      const lastState = this.lastIgnitionState.get(deviceId);
      if (lastState !== undefined && lastState !== currentIgnition) {
        alertsToCreate.push({ 
          type: 'ignition', 
          message: `Engine turned ${currentIgnition ? 'ON' : 'OFF'}`, 
          deviceId, 
          latitude: telemetry.latitude, 
          longitude: telemetry.longitude 
        });
      }
      this.lastIgnitionState.set(deviceId, currentIgnition);
    }

    // 7. Geofence (Custom logic)
    if (clientId) {
      const gfChecks = await this.geofencesService.checkPoint(clientId, deviceId, telemetry.latitude, telemetry.longitude);
      for (const check of gfChecks) {
        const gfId = check.geofence.id;
        const wasInside = this.lastGeofenceState.get(deviceId)?.[gfId];
        if (wasInside !== undefined && wasInside !== check.isInside) {
          const type = check.isInside ? 'geofence_enter' : 'geofence_exit';
          alertsToCreate.push({
            type,
            message: `${check.isInside ? 'Entered' : 'Exited'} geofence: ${check.geofence.name}`,
            deviceId,
            latitude: telemetry.latitude,
            longitude: telemetry.longitude,
          });
        }
        // Update state
        const state = this.lastGeofenceState.get(deviceId) || {};
        state[gfId] = check.isInside;
        this.lastGeofenceState.set(deviceId, state);
      }
    }

    // 8. SOS
    if (telemetry.attributes?.alarm === 'sos') {
      alertsToCreate.push({ type: 'sos', message: 'SOS Panic Button pressed!', deviceId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    for (const alertData of alertsToCreate) {
      const alert = await this.alertRepository.save(this.alertRepository.create({ ...alertData, deviceId, attributes: telemetry.attributes }));
      
      if (clientId) {
        this.positionsGateway.broadcastToClient(clientId, 'new_alert', alert);
      } else {
        this.positionsGateway.broadcastToUser(userId, 'new_alert', alert);
      }
      this.sendEmail(userId, alert);
    }
  }

  async createOfflineAlert(deviceId: string, userId: string, clientId?: string) {
    const alert = await this.alertRepository.save(this.alertRepository.create({
      type: 'offline',
      message: 'Device has gone offline',
      deviceId,
    }));
    
    if (clientId) {
      this.positionsGateway.broadcastToClient(clientId, 'new_alert', alert);
    } else {
      this.positionsGateway.broadcastToUser(userId, 'new_alert', alert);
    }
  }

  private async sendEmail(userId: string, alert: any) {
    // Email alert logic
  }

  async findByClient(clientId: string): Promise<Alert[]> {
    return this.alertRepository.find({
      where: { device: { clientId } },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async findAllByUser(userId: string, clientId?: string): Promise<Alert[]> {
    if (clientId) return this.findByClient(clientId);

    return this.alertRepository.find({
      where: { device: { userId } },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }


  async markAsRead(id: string): Promise<void> {
    await this.alertRepository.update(id, { isRead: true });
  }
}
