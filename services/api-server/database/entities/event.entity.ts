import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Device } from './device.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ length: 128, nullable: true })
  type: string;

  @Column({ type: 'bigint', name: 'deviceid', nullable: true })
  deviceId: string;

  @ManyToOne(() => Device)
  @JoinColumn({ name: 'deviceid' })
  device: Device;

  @Column({ type: 'bigint', name: 'positionid', nullable: true })
  positionId: string;

  @Column({ type: 'timestamp', name: 'eventtime', nullable: true })
  eventTime: Date;

  @Column({ type: 'jsonb', nullable: true })
  attributes: any;
}
