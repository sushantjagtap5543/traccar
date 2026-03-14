import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

@Entity('command_logs')
export class CommandLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string; // engineStop, engineResume

  @Column({ default: 'pending' })
  status: string; // pending, sent, success, failed, retrying

  @Column({ type: 'jsonb', nullable: true })
  result: any;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ nullable: true })
  lastError: string;

  @ManyToOne(() => Vehicle, { onDelete: 'CASCADE' })
  vehicle: Vehicle;

  @Column()
  vehicleId: string;

  @CreateDateColumn()
  createdAt: Date;
}
