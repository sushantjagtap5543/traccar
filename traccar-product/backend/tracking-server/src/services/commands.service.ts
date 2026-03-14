import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommandLog } from '../database/entities/command-log.entity';
import { TraccarService } from './traccar.service';
import { DevicesService } from './devices.service';

@Injectable()
export class CommandsService {
  constructor(
    @InjectRepository(CommandLog)
    private commandLogRepository: Repository<CommandLog>,
    private traccarService: TraccarService,
    private devicesService: DevicesService,
  ) {}

  async sendIgnitionCommand(userId: string, deviceId: string, state: boolean): Promise<CommandLog> {
    const device = await this.devicesService.findOne(deviceId, userId);
    if (!device.traccarDeviceId) {
      throw new BadRequestException('Vehicle is not linked to Traccar server');
    }

    const type = state ? 'engineResume' : 'engineStop';
    const log = this.commandLogRepository.create({
      deviceId,
      type,
      status: 'pending',
    });
    let savedLog = await this.commandLogRepository.save(log);

    try {
      const result = await this.traccarService.sendCommand(device.traccarDeviceId, type);
      
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
      const device = await this.devicesService.findOne(log.deviceId);
      const result = await this.traccarService.sendCommand(device.traccarDeviceId, log.type);
      log.status = 'success';
      log.result = result;
    } catch (error) {
      log.status = 'failed';
      log.lastError = error.message;
    }
    return this.commandLogRepository.save(log);
  }
  async getLogs(userId: string, deviceId: string): Promise<CommandLog[]> {
    await this.devicesService.findOne(deviceId, userId); // Verify ownership
    return this.commandLogRepository.find({
      where: { deviceId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }
}
