import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../database/entities/device.entity';
import { ApprovedDevice } from '../database/entities/approved-device.entity';
import { Permission } from '../database/entities/permission.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { HardwareWhitelist } from '../database/entities/hardware-whitelist.entity';
import { TraccarService } from './traccar.service';
import { UsersService } from './users.service';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(ApprovedDevice)
    private approvedDeviceRepository: Repository<ApprovedDevice>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(HardwareWhitelist)
    private hardwareWhitelistRepository: Repository<HardwareWhitelist>,
    private traccarService: TraccarService,
    private usersService: UsersService,
  ) {}

  async register(userId: string, data: { name: string; uniqueId: string; model?: string }): Promise<Device> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    this.logger.log(`Registering device ${data.uniqueId} for user ${userId}`);
    // 1. Check if uniqueId (IMEI) is specifically approved
    const approved = await this.approvedDeviceRepository.findOne({ where: { imei: data.uniqueId } });
    if (!approved) {
      // 1b. Fallback: check if the prefix (the first 4-8 digits) is in the Hardware Whitelist
      const prefixes = await this.hardwareWhitelistRepository.find({ where: { active: true } });
      const whitelisted = prefixes.some(p => data.uniqueId.startsWith(p.imeiPrefix));
      
      if (!whitelisted) {
        throw new BadRequestException('Hardware Identity not found in Secure Vault. Tactical registration denied.');
      }
    }

    // 2. Check if uniqueId is already registered
    const existing = await this.deviceRepository.findOne({ where: { uniqueId: data.uniqueId } });
    if (existing) {
      throw new BadRequestException('This device is already registered');
    }

    // 3. Create device in Traccar (using uniqueId as the identification)
    const traccarDevice = await this.traccarService.createDevice(data.name, data.uniqueId);

    // 4. Save device in local DB
    const device = this.deviceRepository.create({
      ...data,
      clientId: user.clientId, // Set clientId from user
      model: data.model || approved?.model || 'Tactical Node',
    });

    const savedDevice = await this.deviceRepository.save(device);

    // 5. Create Permission link (User-Device association)
    const permission = this.permissionRepository.create({
      userId,
      deviceId: savedDevice.id,
    });
    await this.permissionRepository.save(permission);

    return savedDevice;
  }

  async findAll(): Promise<Device[]> {
    return this.deviceRepository.find();
  }

  async findByUser(userId: string): Promise<Device[]> {
    if (!userId) {
      this.logger.error('Attempted to fetch devices without userId');
      return [];
    }
    
    try {
      this.logger.log(`Fetching devices for user: ${userId}`);
      const permissions = await this.permissionRepository.find({
        where: { userId },
        relations: ['device'],
      });
      return (permissions || []).map(p => p.device).filter(d => !!d);
    } catch (err) {
      this.logger.error(`Error in findByUser for user ${userId}: ${err.message}`, err.stack);
      throw err;
    }
  }

  async getDeviceUsers(deviceId: string): Promise<string[]> {
    const permissions = await this.permissionRepository.find({
      where: { deviceId },
    });
    return permissions.map(p => p.userId);
  }

  async findByTraccarDeviceId(traccarDeviceId: number): Promise<Device | undefined> {
    return this.deviceRepository.findOne({ where: { traccarDeviceId } });
  }

  async findOne(id: string, userId?: string): Promise<Device> {
    if (userId) {
      const permission = await this.permissionRepository.findOne({
        where: { userId, deviceId: id },
        relations: ['device'],
      });
      if (!permission) {
        throw new NotFoundException('Device not found or unauthorized access');
      }
      return permission.device;
    }

    const device = await this.deviceRepository.findOne({ where: { id } });
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    return device;
  }

  async update(id: string, userId: string, data: Partial<Device>, ipAddress?: string): Promise<Device> {
    const device = await this.findOne(id);
    const oldData = { ...device };
    
    // Update local database
    Object.assign(device, data);
    const updatedDevice = await this.deviceRepository.save(device);

    // Synchronize with Traccar if name or category changed
    if (data.name) {
      await this.traccarService.updateDevice(device.traccarDeviceId, data.name, device.uniqueId);
    }

    // Record Audit Log entry
    const auditLog = this.auditLogRepository.create({
      userId: parseInt(userId),
      action: 'DEVICE_UPDATE',
      resourceId: id,
      details: JSON.stringify({
        changes: data,
        previous: oldData
      }),
      ipAddress: ipAddress || 'unknown'
    });
    await this.auditLogRepository.save(auditLog);

    return updatedDevice;
  }

  async remove(id: string, userId: string): Promise<void> {
    const device = await this.findOne(id, userId);
    // Remove permission first
    await this.permissionRepository.delete({ userId, deviceId: id });
    // Then optionally remove device if no other users have permissions (simplification)
    await this.deviceRepository.remove(device);
  }

  // Strategic Whitelist Management (Admin Only)
  async getWhitelist() { return this.hardwareWhitelistRepository.find(); }
  async addWhitelist(data: { imeiPrefix: string, vendor: string }) {
    return this.hardwareWhitelistRepository.save(this.hardwareWhitelistRepository.create(data));
  }
}

