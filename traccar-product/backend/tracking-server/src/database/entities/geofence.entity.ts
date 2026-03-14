import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Device } from './device.entity';

@Entity('geofences')
export class Geofence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clientId: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb' })
  area: any; // { type: 'Circle', center: [lng, lat], radius: meters } or { type: 'Polygon', coordinates: [...] }

  @Column({ default: 'active' })
  status: string;

  @ManyToMany(() => Device)
  @JoinTable({
    name: 'geofence_devices',
    joinColumn: { name: 'geofenceId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'deviceId', referencedColumnName: 'id' }
  })
  devices: Device[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
