import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

@Entity('command_logs')
export class CommandLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string; // engineStop, engineResume

  @Column({ nullable: true })
  status: string; // pending, success, failed

  @Column({ type: 'jsonb', nullable: true })
  result: any;

  @ManyToOne(() => Vehicle, { onDelete: 'CASCADE' })
  vehicle: Vehicle;

  @Column()
  vehicleId: string;

  @CreateDateColumn()
  createdAt: Date;
}
