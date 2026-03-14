import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../database/entities/device.entity';
import { ApprovedDevice } from '../database/entities/approved-device.entity';
import { TraccarService } from './traccar.service';
import { SubscriptionsService } from './subscriptions.service';
import { UsersService } from './users.service';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(ApprovedDevice)
    private approvedDeviceRepository: Repository<ApprovedDevice>,
    private traccarService: TraccarService,
    private subscriptionsService: SubscriptionsService,
    private usersService: UsersService,
  ) {}

  async register(userId: string, data: { name: string; imei: string; model?: string }): Promise<Device> {
    const user = await this.usersService.findOneById(userId);
    
    // 1. Check if IMEI is approved (Only GeoSurePath devices allowed)
    const approved = await this.approvedDeviceRepository.findOne({ where: { imei: data.imei } });
    if (!approved) {
      throw new BadRequestException('This device is not a registered GeoSurePath device');
    }

    // 2. Check if IMEI is already registered to a device
    const existing = await this.deviceRepository.findOne({ where: { imei: data.imei } });
    if (existing) {
      throw new BadRequestException('This device is already registered');
    }

    // 3. Create device in Traccar
    const traccarDevice = await this.traccarService.createDevice(data.name, data.imei);

    // 4. Save device in local DB
    const device = this.deviceRepository.create({
      ...data,
      userId,
      clientId: user.clientId,
      traccarDeviceId: traccarDevice.id,
      model: data.model || approved.model || 'unknown',
    });

    const savedDevice = await this.deviceRepository.save(device);

    // 5. Create Free Subscription
    await this.subscriptionsService.createFreeSubscription(savedDevice.imei);

    return savedDevice;
  }

  async findByUser(userId: string, clientId?: string): Promise<Device[]> {
    const where: any = { userId };
    if (clientId) {
      where.clientId = clientId;
    }
    return this.deviceRepository.find({ where });
  }

  async findOne(id: string, userId?: string, clientId?: string): Promise<Device> {
    const where: any = { id };
    if (userId) where.userId = userId;
    if (clientId) where.clientId = clientId;

    const device = await this.deviceRepository.findOne({ where });
    if (!device) {
      throw new NotFoundException('Device not found or unauthorized access');
    }
    return device;
  }

  async findByTraccarId(traccarDeviceId: number): Promise<Device> {
    return this.deviceRepository.findOne({ where: { traccarDeviceId } });
  }

  async remove(id: string, userId: string): Promise<void> {
    const device = await this.findOne(id, userId);
    await this.deviceRepository.remove(device);
    // Note: In a production app, we might also want to remove from Traccar
  }
}
