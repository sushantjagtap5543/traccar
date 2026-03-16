import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from './user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ length: 128 })
  name: string;

  @Column({ unique: true, length: 128 })
  email: string;

  @Column({ length: 256, select: false, nullable: true })
  password?: string;

  @Column({ length: 32 })
  mobile: string;

  @Column({ default: false })
  administrator: boolean;

  @Column({ default: false })
  readonly: boolean;

  @Column({ default: false })
  disabled: boolean;

  @Column({ length: 64, nullable: true })
  map: string;

  @Column({ type: 'double precision', default: 0 })
  latitude: number;

  @Column({ type: 'double precision', default: 0 })
  longitude: number;

  @Column({ type: 'integer', default: 0 })
  zoom: number;

  @Column({ name: 'otpCode', length: 10, nullable: true })
  otpCode: string;

  @Column({ name: 'otpExpiresAt', type: 'timestamp', nullable: true })
  otpExpiresAt: Date;

  @Column({ name: 'isOtpVerified', default: false })
  isOtpVerified: boolean;

  @Column({ length: 50, default: 'CLIENT' })
  role: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}


