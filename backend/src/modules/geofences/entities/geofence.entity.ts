import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinTable, ManyToMany } from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Device } from '../../devices/entities/device.entity';

@Entity('geofences')
export class Geofence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  area: any; // { type: 'Circle', radius: 500, center: [lng, lat] } or { type: 'Polygon', coordinates: [...] }

  @Column({ default: 'both' }) // enter, exit, both
  alertType: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  client: Client;

  @Column()
  clientId: string;

  @ManyToMany(() => Device)
  @JoinTable({ name: 'geofence_devices' })
  devices: Device[];

  @CreateDateColumn()
  createdAt: Date;
}
