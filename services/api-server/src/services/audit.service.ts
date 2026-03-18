import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../database/entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async findAll() {
    return this.auditLogRepository.find({
      order: { createdAt: 'DESC' },
      take: 100
    });
  }

  async log(userId: number, action: string, resourceId?: string, details?: any, ipAddress?: string) {
    const entry = this.auditLogRepository.create({
      userId,
      action,
      resourceId,
      details: typeof details === 'string' ? details : JSON.stringify(details),
      ipAddress
    });
    return this.auditLogRepository.save(entry);
  }
}
