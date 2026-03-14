import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './entities/alert.entity';
import { TelemetryGateway } from '../telemetry/telemetry.gateway';
import { MailerService } from '@nestjs-modules/mailer'; // Optional: if using a module, or just use nodemailer directly

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    private telemetryGateway: TelemetryGateway,
  ) {}

  async processTelemetry(vehicleId: string, telemetry: any, userId: string) {
    const alertsToCreate: Partial<Alert>[] = [];

    // 1. Overspeed
    if (telemetry.speed > (telemetry.speedLimit || 80)) {
      alertsToCreate.push({ type: 'overspeed', message: `Vehicle exceeded speed limit: ${telemetry.speed} km/h`, vehicleId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    // 2. Power Cut
    if (telemetry.attributes?.alarm === 'powerCut') {
      alertsToCreate.push({ type: 'power_cut', message: 'Main power supply disconnected', vehicleId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    // 3. Vibration
    if (telemetry.attributes?.alarm === 'vibration') {
      alertsToCreate.push({ type: 'vibration', message: 'Vibration detected while parked', vehicleId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    // 4. Tow
    if (telemetry.attributes?.alarm === 'tow') {
      alertsToCreate.push({ type: 'tow', message: 'Vehicle is being towed', vehicleId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    // 5. Low Battery
    if (telemetry.attributes?.batteryLevel < 20) {
      alertsToCreate.push({ type: 'low_battery', message: 'Device battery is low', vehicleId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    // 6. Engine ON/OFF
    if (telemetry.attributes?.ignition !== undefined) {
      const state = telemetry.attributes.ignition ? 'ON' : 'OFF';
      // Usually we only alert on change, but for now:
      // alertsToCreate.push({ type: 'engine_state', message: `Engine turned ${state}`, vehicleId });
    }

    // 7. Geofence
    if (telemetry.geofenceEvent) {
       alertsToCreate.push({ type: 'geofence', message: `Geofence ${telemetry.geofenceEvent}: ${telemetry.geofenceName}`, vehicleId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    // 8. Route Deviation
    if (telemetry.routeDeviation) {
      alertsToCreate.push({ type: 'route_deviation', message: 'Vehicle deviated from the assigned route', vehicleId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    // 9. GPS Lost
    if (telemetry.gpsStatus === 'invalid') {
      alertsToCreate.push({ type: 'gps_lost', message: 'GPS signal lost', vehicleId });
    }

    // 10. Device Offline
    if (telemetry.status === 'offline') {
      alertsToCreate.push({ type: 'device_offline', message: 'Device went offline', vehicleId });
    }

    // 11. Harsh Braking
    if (telemetry.attributes?.alarm === 'hardBraking') {
      alertsToCreate.push({ type: 'harsh_braking', message: 'Harsh braking detected', vehicleId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    // 12. Harsh Acceleration
    if (telemetry.attributes?.alarm === 'hardAcceleration') {
      alertsToCreate.push({ type: 'harsh_acceleration', message: 'Harsh acceleration detected', vehicleId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    // 13. Fuel Drop
    if (telemetry.fuelChange < -5) { // 5% drop
      alertsToCreate.push({ type: 'fuel_drop', message: 'Sudden fuel level drop detected', vehicleId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    // 14. Temperature
    if (telemetry.temperature > 40 || telemetry.temperature < 0) {
      alertsToCreate.push({ type: 'temperature', message: `Abnormal temperature detected: ${telemetry.temperature}°C`, vehicleId });
    }

    // 15. SOS
    if (telemetry.attributes?.alarm === 'sos') {
      alertsToCreate.push({ type: 'sos', message: 'SOS Panic Button pressed!', vehicleId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    // 16. Door Open
    if (telemetry.attributes?.door) {
      alertsToCreate.push({ type: 'door_open', message: 'Door opened', vehicleId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    // 17. Maintenance Due
    if (telemetry.maintenanceDistance > 5000) {
      alertsToCreate.push({ type: 'maintenance_due', message: 'Maintenance service is due', vehicleId });
    }

    // 18. Route Delay
    if (telemetry.estimatedDelay > 30) { // 30 mins
      alertsToCreate.push({ type: 'route_delay', message: 'Significant route delay detected', vehicleId });
    }

    for (const alertData of alertsToCreate) {
      const alert = await this.alertRepository.save(this.alertRepository.create({ ...alertData, vehicleId }));
      
      // 1. WebSocket Notification
      this.telemetryGateway.broadcastToUser(userId, 'new_alert', alert);

      // 2. Email Notification (SMTP - Free)
      this.sendEmail(userId, alert);
    }
  }

  private async sendEmail(userId: string, alert: any) {
    // Implementation for free SMTP email
    // console.log(`Email sent to user ${userId} for alert ${alert.type}`);
  }

  async findAllByUser(userId: string): Promise<Alert[]> {
    // Join with vehicles to filter by userId
    return this.alertRepository.find({
      where: { vehicle: { userId } },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(id: string): Promise<void> {
    await this.alertRepository.update(id, { isRead: true });
  }
}
