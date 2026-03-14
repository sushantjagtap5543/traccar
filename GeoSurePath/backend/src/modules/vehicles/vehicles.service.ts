import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { ApprovedDevice } from './entities/approved-device.entity';
import { TraccarService } from '../traccar/traccar.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(ApprovedDevice)
    private approvedDeviceRepository: Repository<ApprovedDevice>,
    private traccarService: TraccarService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async register(userId: string, data: { name: string; imei: string; model?: string }): Promise<Vehicle> {
    // 1. Check if IMEI is approved (Only GeoSurePath devices allowed)
    const approved = await this.approvedDeviceRepository.findOne({ where: { imei: data.imei } });
    if (!approved) {
      throw new BadRequestException('This device is not a registered GeoSurePath device');
    }

    // 2. Check if IMEI is already registered to a vehicle
    const existing = await this.vehicleRepository.findOne({ where: { imei: data.imei } });
    if (existing) {
      throw new BadRequestException('This device is already registered');
    }

    // 3. Create device in Traccar
    const traccarDevice = await this.traccarService.createDevice(data.name, data.imei);

    // 4. Save vehicle in local DB
    const vehicle = this.vehicleRepository.create({
      ...data,
      userId,
      traccarDeviceId: traccarDevice.id,
      model: data.model || approved.model || 'unknown',
    });

    const savedVehicle = await this.vehicleRepository.save(vehicle);

    // 5. Create Free Subscription
    await this.subscriptionsService.createFreeSubscription(savedVehicle.imei);

    return savedVehicle;
  }

  async findAllByUser(userId: string): Promise<Vehicle[]> {
    return this.vehicleRepository.find({ where: { userId } });
  }

  async findOne(id: string, userId: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id, userId } });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return vehicle;
  }

  async remove(id: string, userId: string): Promise<void> {
    const vehicle = await this.findOne(id, userId);
    await this.vehicleRepository.remove(vehicle);
    // Note: In a production app, we might also want to remove from Traccar
  }
}
