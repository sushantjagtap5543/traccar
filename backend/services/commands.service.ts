import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommandLog } from './entities/command-log.entity';
import { TraccarService } from '../traccar/traccar.service';
import { VehiclesService } from '../vehicles/vehicles.service';

@Injectable()
export class CommandsService {
  constructor(
    @InjectRepository(CommandLog)
    private commandLogRepository: Repository<CommandLog>,
    private traccarService: TraccarService,
    private vehiclesService: VehiclesService,
  ) {}

  async sendIgnitionCommand(userId: string, vehicleId: string, state: boolean): Promise<CommandLog> {
    const vehicle = await this.vehiclesService.findOne(vehicleId, userId);
    if (!vehicle.traccarDeviceId) {
      throw new BadRequestException('Vehicle is not linked to Traccar server');
    }

    const type = state ? 'engineResume' : 'engineStop';
    const log = this.commandLogRepository.create({
      vehicleId,
      type,
      status: 'pending',
    });
    const savedLog = await this.commandLogRepository.save(log);

    try {
      const vehicle = await this.vehiclesService.findOne(vehicleId);
      const result = await this.traccarService.sendCommand(vehicle.traccarDeviceId, type);
      
      savedLog.status = 'success';
      savedLog.result = result;
      return await this.commandLogRepository.save(savedLog);
    } catch (error) {
      savedLog.status = 'failed';
      savedLog.lastError = error.message;
      savedLog.retryCount = 0; // Initial fail
      return await this.commandLogRepository.save(savedLog);
    }
  }

  async retryCommand(logId: string) {
    const log = await this.commandLogRepository.findOne({ where: { id: logId } });
    if (!log || log.status === 'success') return log;

    log.status = 'retrying';
    log.retryCount += 1;
    await this.commandLogRepository.save(log);

    try {
      const vehicle = await this.vehiclesService.findOne(log.vehicleId);
      const result = await this.traccarService.sendCommand(vehicle.traccarDeviceId, log.type);
      log.status = 'success';
      log.result = result;
    } catch (error) {
      log.status = 'failed';
      log.lastError = error.message;
    }
    return this.commandLogRepository.save(log);
  }
  async getLogs(userId: string, vehicleId: string): Promise<CommandLog[]> {
    await this.vehiclesService.findOne(vehicleId, userId); // Verify ownership
    return this.commandLogRepository.find({
      where: { vehicleId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }
}
