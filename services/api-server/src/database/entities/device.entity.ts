import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Group } from './group.entity';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ length: 128 })
  name: string;

  @Column({ unique: true, length: 128 })
  uniqueId: string;

  @Column({ name: 'traccar_device_id', type: 'bigint', nullable: true })
  traccarDeviceId: string;

  @Column({ type: 'jsonb', nullable: true })
  attributes: any;

  @Column({ length: 32, nullable: true })
  status: string;

  @Column({ type: 'timestamp', nullable: true, name: 'lastupdate' })
  lastUpdate: Date;

  @Column({ type: 'bigint', nullable: true, name: 'positionid' })
  positionId: string;

  @Column({ type: 'bigint', nullable: true, name: 'groupid' })
  groupId: string;

  @ManyToOne(() => Group)
  @JoinColumn({ name: 'groupid' })
  group: Group;

  @Column({ length: 128, nullable: true })
  model: string;

  @Column({ length: 128, nullable: true })
  contact: string;

  @Column({ length: 32, nullable: true })
  phone: string;

  @Column({ length: 32, nullable: true })
  category: string;

  @Column({ default: false })
  disabled: boolean;
}

