import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../database/entities/device.entity';
import { ApprovedDevice } from '../database/entities/approved-device.entity';
import { Permission } from '../database/entities/permission.entity';
import { TraccarService } from './traccar.service';
import { UsersService } from './users.service';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(ApprovedDevice)
    private approvedDeviceRepository: Repository<ApprovedDevice>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    private traccarService: TraccarService,
    private usersService: UsersService,
  ) {}

  async register(userId: string, data: { name: string; uniqueId: string; model?: string }): Promise<Device> {
    await this.usersService.findOneById(userId);
    
    // 1. Check if uniqueId (IMEI) is approved
    const approved = await this.approvedDeviceRepository.findOne({ where: { imei: data.uniqueId } });
    if (!approved) {
      throw new BadRequestException('This device is not a registered GeoSurePath device');
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
      model: data.model || approved.model || 'unknown',
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

  async findByUser(userId: string): Promise<Device[]> {
    const permissions = await this.permissionRepository.find({
      where: { userId },
      relations: ['device'],
    });
    return permissions.map(p => p.device);
  }

  async getDeviceUsers(deviceId: string): Promise<string[]> {
    const permissions = await this.permissionRepository.find({
      where: { deviceId },
    });
    return permissions.map(p => p.userId);
  }

  async findOneByTraccarId(positionId: string): Promise<Device | undefined> {
    // Note: in the new schema, positionId is a field in devices table
    return this.deviceRepository.findOne({ where: { positionId } });
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

  async remove(id: string, userId: string): Promise<void> {
    const device = await this.findOne(id, userId);
    // Remove permission first
    await this.permissionRepository.delete({ userId, deviceId: id });
    // Then optionally remove device if no other users have permissions (simplification)
    await this.deviceRepository.remove(device);
  }
}

