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

  async processTelemetry(vehicleId: string, telemetry: any, userId: string, clientId?: string) {
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
      // Logic for ignition change alerts can be added here
    }

    // 7. Geofence
    if (telemetry.geofenceEvent) {
       alertsToCreate.push({ type: 'geofence', message: `Geofence ${telemetry.geofenceEvent}: ${telemetry.geofenceName}`, vehicleId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    // 8. SOS
    if (telemetry.attributes?.alarm === 'sos') {
      alertsToCreate.push({ type: 'sos', message: 'SOS Panic Button pressed!', vehicleId, latitude: telemetry.latitude, longitude: telemetry.longitude });
    }

    for (const alertData of alertsToCreate) {
      const alert = await this.alertRepository.save(this.alertRepository.create({ ...alertData, vehicleId }));
      
      if (clientId) {
        this.telemetryGateway.broadcastToClient(clientId, 'new_alert', alert);
      } else {
        this.telemetryGateway.broadcastToUser(userId, 'new_alert', alert);
      }
      this.sendEmail(userId, alert);
    }
  }

  private async sendEmail(userId: string, alert: any) {
    // console.log(`Email alert sent to user ${userId}`);
  }

  async findByClient(clientId: string): Promise<Alert[]> {
    return this.alertRepository.find({
      where: { vehicle: { clientId } },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async findAllByUser(userId: string, clientId?: string): Promise<Alert[]> {
    if (clientId) return this.findByClient(clientId);

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
