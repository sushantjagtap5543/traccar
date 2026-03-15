import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Device } from './device.entity';

@Entity('positions')
export class Position {
  @PrimaryColumn({ type: 'bigint' })
  id: string;

  @Column({ length: 128, nullable: true })
  protocol: string;

  @Column({ type: 'bigint', name: 'deviceid' })
  deviceId: string;

  @ManyToOne(() => Device)
  @JoinColumn({ name: 'deviceid' })
  device: Device;

  @Column({ type: 'timestamp', nullable: true, name: 'servertime' })
  serverTime: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'devicetime' })
  deviceTime: Date;

  @PrimaryColumn({ type: 'timestamp', name: 'fixtime' })
  fixTime: Date;

  @Column({ type: 'double precision', nullable: true })
  latitude: number;

  @Column({ type: 'double precision', nullable: true })
  longitude: number;

  @Column({ type: 'double precision', nullable: true })
  altitude: number;

  @Column({ type: 'double precision', nullable: true })
  speed: number;

  @Column({ type: 'double precision', nullable: true })
  course: number;

  @Column({ type: 'double precision', nullable: true })
  accuracy: number;

  @Column({ type: 'jsonb', nullable: true })
  attributes: any;
}
