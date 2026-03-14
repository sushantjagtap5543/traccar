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
      type,
      vehicleId,
      status: 'pending',
    });
    
    const savedLog = await this.commandLogRepository.save(log);

    try {
      const result = await this.traccarService.sendCommand(vehicle.traccarDeviceId, type);
      savedLog.status = 'success';
      savedLog.result = result;
    } catch (e) {
      savedLog.status = 'failed';
      savedLog.result = { error: e.message };
    }

    return this.commandLogRepository.save(savedLog);
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
