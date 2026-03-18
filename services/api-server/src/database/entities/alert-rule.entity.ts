import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('alert_rules')
export class AlertRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'deviceId' })
  deviceId: string;

  @Column({ length: 64 })
  type: 'overspeed' | 'idle' | 'status_change' | 'maintenance_due';

  @Column({ type: 'float', nullable: true })
  threshold: number;

  @Column({ default: 'whatsapp' })
  channel: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ length: 128, nullable: true })
  recipient: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
