import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'clientId' })
  clientId: string;

  @Column({ length: 128 })
  name: string;

  @Column({ length: 64, unique: true })
  phone: string;

  @Column({ length: 128, nullable: true })
  licenseNumber: string;

  @Column({ length: 32, default: 'available' })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ length: 256, nullable: true })
  photoUrl: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
