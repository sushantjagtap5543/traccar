import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Group } from './group.entity';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'clientId' })
  clientId: string;

  @Column({ length: 128 })
  name: string;

  @Column({ unique: true, length: 128, name: 'imei' })
  uniqueId: string;

  @Column({ name: 'traccarDeviceId', type: 'integer', nullable: true })
  traccarDeviceId: number;

  @Column({ type: 'uuid', nullable: true, name: 'userId' })
  userId: string;

  @Column({ length: 32, default: 'active' })
  status: string;

  @Column({ length: 128, default: 'unknown' })
  model: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}

