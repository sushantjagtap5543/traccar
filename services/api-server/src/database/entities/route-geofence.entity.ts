import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('tactical_route_geofences')
export class RouteGeofence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  deviceId: string;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb' })
  coordinates: { lat: number, lng: number }[]; // Array of points along the route

  @Column({ type: 'float', default: 500 })
  bufferMeters: number; // Max distance allowed from the route

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
