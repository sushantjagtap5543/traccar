import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Device } from '../../devices/entities/device.entity';

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string; // overspeed, power_cut, etc.

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'decimal', nullable: true })
  latitude: number;

  @Column({ type: 'decimal', nullable: true })
  longitude: number;

  @Column({ type: 'jsonb', nullable: true })
  attributes: any;

  @ManyToOne(() => Device, { onDelete: 'CASCADE' })
  device: Device;

  @Column()
  deviceId: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
