import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from '../database/entities/driver.entity';
import { AlertRule } from '../database/entities/alert-rule.entity';
import { Device } from '../database/entities/device.entity';
import { TacticalExpense } from '../database/entities/tactical-expense.entity';
import { TacticalDocument } from '../database/entities/tactical-document.entity';
import { RouteGeofence } from '../database/entities/route-geofence.entity';

@Injectable()
export class TacticalService {
  private readonly logger = new Logger(TacticalService.name);

  constructor(
    @InjectRepository(Driver)
    private driverRepo: Repository<Driver>,
    @InjectRepository(AlertRule)
    private alertRuleRepo: Repository<AlertRule>,
    @InjectRepository(Device)
    private deviceRepo: Repository<Device>,
    @InjectRepository(TacticalExpense)
    private expenseRepo: Repository<TacticalExpense>,
    @InjectRepository(TacticalDocument)
    private documentRepo: Repository<TacticalDocument>,
    @InjectRepository(RouteGeofence)
    private routeGeofenceRepo: Repository<RouteGeofence>,
  ) {}

  // --- DRIVER GOVERNANCE ---
  async getDrivers(clientId: string) {
    return this.driverRepo.find({ where: { clientId } });
  }

  async createDriver(clientId: string, data: Partial<Driver>) {
    const driver = this.driverRepo.create({ ...data, clientId });
    return this.driverRepo.save(driver);
  }

  async updateDriver(id: string, data: Partial<Driver>) {
    await this.driverRepo.update(id, data);
    return this.driverRepo.findOne({ where: { id } });
  }

  async deleteDriver(id: string) {
    await this.driverRepo.delete(id);
    return { success: true };
  }

  // --- ASSET RESPONSIBILITY BINDING ---
  async assignDriver(deviceId: string, driverId: string | null) {
    const device = await this.deviceRepo.findOne({ where: { id: deviceId } });
    if (!device) throw new NotFoundException('Asset signature not found');
    
    device.driverId = driverId;
    await this.deviceRepo.save(device);
    
    this.logger.log(`Strategic Resource Assigned: Device ${deviceId} -> Driver ${driverId}`);
    return device;
  }

  // --- PROACTIVE ALERT RULES ---
  async getAlertRules(deviceId: string) {
    return this.alertRuleRepo.find({ where: { deviceId } });
  }

  async setAlertRule(data: Partial<AlertRule>) {
    const existing = await this.alertRuleRepo.findOne({ where: { deviceId: data.deviceId, type: data.type } });
    if (existing) {
      Object.assign(existing, data);
      return this.alertRuleRepo.save(existing);
    }
    const rule = this.alertRuleRepo.create(data);
    return this.alertRuleRepo.save(rule);
  }

  // --- THE "EXTERNAL SHARE" ENGINE (LIVE TRACKING) ---
  async generateShareLink(deviceId: string) {
    // Generate a temporary access signature (simulating a signed JWT)
    const signature = Buffer.from(`${deviceId}:${Date.now() + 86400000}`).toString('base64');
    const shareLink = `https://geosure-track.live/v3/public/share/${signature}`;
    
    this.logger.log(`External Intelligence Port opened for asset: ${deviceId}`);
    return { shareLink, expires: new Date(Date.now() + 86400000) };
  }

  // --- DATA EXPORT GOVERNANCE (CSV MOCK) ---
  async getExportData(deviceId: string) {
     const device = await this.deviceRepo.findOne({ where: { id: deviceId } });
     if (!device) throw new NotFoundException('Asset not found');

     // High-fidelity telemetry mock for CSV export
     return [
       ["Timestamp", "Latitude", "Longitude", "Velocity", "Fuel Level", "Odometer"],
       [new Date().toISOString(), 18.5204, 73.8567, 45, 82, device.odometer],
       [new Date(Date.now() - 3600000).toISOString(), 18.5215, 73.8580, 52, 81.5, device.odometer - 2.5]
     ];
  }

  // --- TACTICAL FINANCIALS (EXPENSES) ---
  async getExpenses(userId: string, deviceId: string) {
    return this.expenseRepo.find({ where: { userId, deviceId }, order: { date: 'DESC' } });
  }

  async addExpense(userId: string, data: Partial<TacticalExpense>) {
    const expense = this.expenseRepo.create({ ...data, userId });
    return this.expenseRepo.save(expense);
  }

  // --- DOCUMENT GOVERNANCE (VAULT) ---
  async getDocuments(userId: string, deviceId: string) {
    return this.documentRepo.find({ where: { userId, deviceId }, order: { expiresAt: 'ASC' } });
  }

  async addDocument(userId: string, data: Partial<TacticalDocument>) {
    const document = this.documentRepo.create({ ...data, userId });
    return this.documentRepo.save(document);
  }

  // --- ROUTE GEOFENCING ---
  async getRouteGeofences(userId: string, deviceId: string) {
    return this.routeGeofenceRepo.find({ where: { userId, deviceId } });
  }

  async addRouteGeofence(userId: string, data: Partial<RouteGeofence>) {
    const geofence = this.routeGeofenceRepo.create({ ...data, userId });
    return this.routeGeofenceRepo.save(geofence);
  }
}
