import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Device } from './device.entity';

@Entity('geofences')
export class Geofence {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ length: 128, nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  area: string;

  @ManyToMany(() => Device)
  @JoinTable({
    name: 'device_geofence',
    joinColumn: { name: 'geofence_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'device_id', referencedColumnName: 'id' }
  })
  devices: Device[];

  @Column({ name: 'user_id', type: 'bigint', nullable: true })
  userId: string;

  @Column({ type: 'jsonb', nullable: true })
  attributes: any;
}
