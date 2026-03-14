import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from '../database/entities/alert.entity';
import { PositionsGateway } from '../../server/modules/positions.gateway';
import { GeofencesService } from './geofences.service';

@Injectable()
export class AlertsService {
  private lastIgnitionState = new Map<string, boolean>();
  private lastGeofenceState = new Map<string, Record<string, boolean>>();
  private lastAlertTimes = new Map<string, number>();

  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    @Inject(forwardRef(() => PositionsGateway))
    private positionsGateway: PositionsGateway,
    private geofencesService: GeofencesService,
  ) {}

  private isCooldownActive(deviceId: string, type: string): boolean {
    const key = `${deviceId}:${type}`;
    const lastTime = this.lastAlertTimes.get(key) || 0;
    const now = Date.now();
    const cooldownMs = 15 * 60 * 1000; // 15 minutes
    
    if (now - lastTime < cooldownMs) return true;
    this.lastAlertTimes.set(key, now);
    return false;
  }

  async processTelemetry(deviceId: string, telemetry: any, userId: string, clientId?: string) {
    const alertsToCreate: Partial<Alert>[] = [];
    const attributes = telemetry.attributes || {};
    const alarm = attributes.alarm;
    
    // 1. Overspeed (Convert knots to km/h if needed, Traccar usually returns knots or km/h based on config, but we ensure km/h here)
    const speedKmh = telemetry.speed * 1.852; // Assuming knots for standard GPS output, else use telemetry.speed directly if configured
    const speedLimit = telemetry.speedLimit || 80;

    if (speedKmh > speedLimit) {
       if (!this.isCooldownActive(deviceId, 'overspeed')) {
         alertsToCreate.push({ 
           type: 'overspeed', 
           message: `Vehicle exceeded speed limit: ${Math.round(speedKmh)} km/h`, 
           deviceId, 
           latitude: telemetry.latitude, 
           longitude: telemetry.longitude 
         });
       }
    }

    // 2. Power Cut / Vibration / Tow / SOS / Signal Lost / Harsh Braking / Tampering
    const commonAlarms = [
      { key: 'powerCut', type: 'power_cut', msg: 'Main power supply disconnected' },
      { key: 'vibration', type: 'vibration', msg: 'Vibration detected while parked' },
      { key: 'tow', type: 'tow', msg: 'Vehicle is being towed' },
      { key: 'sos', type: 'sos', msg: 'SOS Panic Button pressed!' },
      { key: 'jamming', type: 'jamming', msg: 'Signal jamming detected' },
      { key: 'hardBraking', type: 'harsh_braking', msg: 'Harsh braking detected' },
      { key: 'hardAcceleration', type: 'harsh_acceleration', msg: 'Harsh acceleration detected' },
      { key: 'hardCornering', type: 'harsh_cornering', msg: 'Harsh cornering detected' },
      { key: 'tampering', type: 'tampering', msg: 'Device tampering detected' }
    ];

    commonAlarms.forEach(a => {
      if (alarm === a.key && !this.isCooldownActive(deviceId, a.type)) {
        alertsToCreate.push({ type: a.type, message: a.msg, deviceId, latitude: telemetry.latitude, longitude: telemetry.longitude });
      }
    });

    // 4. Power Restored
    if (alarm === 'powerRestored' && !this.isCooldownActive(deviceId, 'power_restored')) {
      alertsToCreate.push({ type: 'power_restored', message: 'Main power supply restored', deviceId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    // 5. Low Battery (Ensure batteryLevel exists and is numeric)
    const batLevel = parseFloat(attributes.batteryLevel);
    if (!isNaN(batLevel) && batLevel < 20 && !this.isCooldownActive(deviceId, 'low_battery')) {
      alertsToCreate.push({ type: 'low_battery', message: `Device battery is low (${Math.round(batLevel)}%)`, deviceId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    // 6. Ignition Change (State aware)
    const currentIgnition = attributes.ignition;
    if (currentIgnition !== undefined) {
      const lastState = this.lastIgnitionState.get(deviceId);
      if (lastState !== undefined && lastState !== currentIgnition) {
        const type = currentIgnition ? 'ignition_on' : 'ignition_off';
        alertsToCreate.push({ 
          type, 
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
          if (!this.isCooldownActive(deviceId, `${type}:${gfId}`)) {
            alertsToCreate.push({
              type,
              message: `${check.isInside ? 'Entered' : 'Exited'} geofence: ${check.geofence.name}`,
              deviceId,
              latitude: telemetry.latitude,
              longitude: telemetry.longitude,
            });
          }
        }
        const state = this.lastGeofenceState.get(deviceId) || {};
        state[gfId] = check.isInside;
        this.lastGeofenceState.set(deviceId, state);
      }
    }

    // 10. GPS Signal
    if (attributes.gps === 'lost' && !this.isCooldownActive(deviceId, 'gps_lost')) {
       alertsToCreate.push({ type: 'gps_lost', message: 'GPS satellite signal lost', deviceId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    // 16. Door (Improved check for boolean or string 'true')
    const doorOpen = attributes.door === true || attributes.door === 'true';
    if (doorOpen && !this.isCooldownActive(deviceId, 'door_open')) {
       alertsToCreate.push({ type: 'door_open', message: 'Unauthorized door access detected', deviceId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    // 17. Idling (Ignition ON but speed is 0 for more than 10 mins)
    if (currentIgnition && speedKmh < 1) {
       const key = `${deviceId}:idling_start`;
       const idleStart = this.lastAlertTimes.get(key) || Date.now();
       if (!this.lastAlertTimes.has(key)) this.lastAlertTimes.set(key, idleStart);
       
       if (Date.now() - idleStart > 10 * 60 * 1000 && !this.isCooldownActive(deviceId, 'idling')) {
         alertsToCreate.push({ type: 'idling', message: 'Excessive idling detected (>10 mins)', deviceId, latitude: telemetry.latitude, longitude: telemetry.longitude });
       }
    } else {
       this.lastAlertTimes.delete(`${deviceId}:idling_start`);
    }

    for (const alertData of alertsToCreate) {
      const alert = await this.alertRepository.save(this.alertRepository.create({ ...alertData, deviceId, attributes }));
      
      if (clientId) {
        this.positionsGateway.broadcastToClient(clientId, 'new_alert', alert);
      } else {
        this.positionsGateway.broadcastToUser(userId, 'new_alert', alert);
      }
      this.sendEmail(userId, alert);
    }
  }

  async createOfflineAlert(deviceId: string, userId: string, clientId?: string) {
    if (this.isCooldownActive(deviceId, 'offline')) return;

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
    // Email alert logic - Integration with SendGrid or SMTP could be added here
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
