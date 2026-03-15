import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../database/entities/event.entity';
import { PositionsGateway } from '../server/modules/positions.gateway';
import { GeofencesService } from './geofences.service';
import { DevicesService } from './devices.service';

@Injectable()
export class AlertsService {
  private lastIgnitionState = new Map<string, boolean>();
  private lastGeofenceState = new Map<string, Record<string, boolean>>();
  private lastAlertTimes = new Map<string, number>();

  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @Inject(forwardRef(() => PositionsGateway))
    private positionsGateway: PositionsGateway,
    private geofencesService: GeofencesService,
    private devicesService: DevicesService,
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

  async processTelemetry(deviceId: string, telemetry: any) {
    const eventsToCreate: Partial<Event>[] = [];
    const attributes = telemetry.attributes || {};
    const alarm = attributes.alarm;
    
    // 1. Overspeed
    if (telemetry.speed > (telemetry.speedLimit || 80)) {
       if (!this.isCooldownActive(deviceId, 'overspeed')) {
         eventsToCreate.push({ type: 'overspeed', deviceId, attributes: { ...attributes, message: `Vehicle exceeded speed limit: ${Math.round(telemetry.speed)} km/h` } });
       }
    }

    // 2. Power Cut / Vibration / Tow / SOS / Signal Lost / Harsh Braking
    const commonAlarms = [
      { key: 'powerCut', type: 'power_cut', msg: 'Main power supply disconnected' },
      { key: 'vibration', type: 'vibration', msg: 'Vibration detected while parked' },
      { key: 'tow', type: 'tow', msg: 'Vehicle is being towed' },
      { key: 'sos', type: 'sos', msg: 'SOS Panic Button pressed!' },
      { key: 'jamming', type: 'jamming', msg: 'Signal jamming detected' },
      { key: 'hardBraking', type: 'harsh_braking', msg: 'Harsh braking detected' },
      { key: 'hardAcceleration', type: 'harsh_acceleration', msg: 'Harsh acceleration detected' },
      { key: 'hardCornering', type: 'harsh_cornering', msg: 'Harsh cornering detected' }
    ];

    commonAlarms.forEach(a => {
      if (alarm === a.key && !this.isCooldownActive(deviceId, a.type)) {
        eventsToCreate.push({ type: a.type, deviceId, attributes: { ...attributes, message: a.msg } });
      }
    });

    // 5. Low Battery
    if (attributes.batteryLevel < 20 && !this.isCooldownActive(deviceId, 'low_battery')) {
      eventsToCreate.push({ type: 'low_battery', deviceId, attributes: { ...attributes, message: `Device battery is low (${attributes.batteryLevel}%)` } });
    }

    // 6. Ignition Change
    const currentIgnition = attributes.ignition;
    if (currentIgnition !== undefined) {
      const lastState = this.lastIgnitionState.get(deviceId);
      if (lastState !== undefined && lastState !== currentIgnition) {
        eventsToCreate.push({ 
          type: 'ignition', 
          deviceId, 
          attributes: { ...attributes, message: `Engine turned ${currentIgnition ? 'ON' : 'OFF'}` }
        });
      }
      this.lastIgnitionState.set(deviceId, currentIgnition);
    }

    // 7. Geofence (Now global/per-user instead of per-client)
    // Production Note: This requires the GeofencesService to cross-reference 
    // device coordinates with per-user geofence boundaries.
    const users = await this.devicesService.getDeviceUsers(deviceId);
    for (const userId of users) {
        // TODO: Implement user-specific geofence entry/exit detection
        // Example: this.geofencesService.checkUserGeofences(userId, deviceId, telemetry.latitude, telemetry.longitude);
    }

    // 10. GPS Signal
    if (attributes.gps === 'lost' && !this.isCooldownActive(deviceId, 'gps_lost')) {
       eventsToCreate.push({ type: 'gps_lost', deviceId, attributes: { ...attributes, message: 'GPS satellite signal lost' } });
    }

    // 16. Door
    if (attributes.door === true && !this.isCooldownActive(deviceId, 'door_open')) {
       eventsToCreate.push({ type: 'door_open', deviceId, attributes: { ...attributes, message: 'Unauthorized door access detected' } });
    }

    for (const eventData of eventsToCreate) {
      const event = await this.eventRepository.save(this.eventRepository.create({ 
        ...eventData, 
        eventTime: new Date(),
        deviceId 
      }));
      
      const usersWithAccess = await this.devicesService.getDeviceUsers(deviceId);
      for (const userId of usersWithAccess) {
        this.positionsGateway.broadcastToUser(userId, 'new_event', event);
        this.sendEmail(userId, event);
      }
    }
  }

  async createOfflineAlert(deviceId: string) {
    if (this.isCooldownActive(deviceId, 'offline')) return;

    const event = await this.eventRepository.save(this.eventRepository.create({
      type: 'offline',
      deviceId,
      eventTime: new Date(),
      attributes: { message: 'Device has gone offline' }
    }));
    
    const usersWithAccess = await this.devicesService.getDeviceUsers(deviceId);
    for (const userId of usersWithAccess) {
      this.positionsGateway.broadcastToUser(userId, 'new_event', event);
    }
  }

  private async sendEmail(userId: string, event: any) {
    // Email alert logic
  }

  async findAllByUser(userId: string): Promise<Event[]> {
    // This requires a join with permissions
    return this.eventRepository.createQueryBuilder('event')
      .innerJoin('permissions', 'p', 'p.deviceid = event.deviceid')
      .where('p.userid = :userId', { userId })
      .orderBy('event.eventtime', 'DESC')
      .take(50)
      .getMany();
  }

  async markAsRead(id: string): Promise<void> {
    // Note: the new events table doesn't have is_read. 
    // This would likely be handled by a separate user_events or notification_status table in production.
  }
}

