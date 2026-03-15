import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Device } from './device.entity';

@Entity('command_logs')
export class CommandLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'device_id' })
  deviceId: string;

  @ManyToOne(() => Device)
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @Column()
  type: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  result: any;

  @Column({ name: 'last_error', nullable: true })
  lastError: string;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
