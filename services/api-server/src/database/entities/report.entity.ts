import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Device } from './device.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', name: 'userid', nullable: true })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userid' })
  user: User;

  @Column({ type: 'bigint', name: 'deviceid', nullable: true })
  deviceId: string;

  @ManyToOne(() => Device)
  @JoinColumn({ name: 'deviceid' })
  device: Device;

  @Column({ length: 128, nullable: true, name: 'reporttype' })
  reportType: string;

  @CreateDateColumn({ name: 'createdat' })
  createdAt: Date;
}
