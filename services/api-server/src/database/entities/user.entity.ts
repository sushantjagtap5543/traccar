import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from './user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'clientId', nullable: true })
  clientId: string;

  @Column({ length: 128, nullable: true })
  name: string;

  @Column({ unique: true, length: 128, nullable: true })
  email: string;

  @Column({ length: 128, nullable: true })
  company: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ length: 256, select: false, nullable: true })
  password?: string;

  @Column({ length: 32 })
  mobile: string;

  @Column({ name: 'otpCode', length: 10, nullable: true })
  otpCode: string;

  @Column({ name: 'otpExpiresAt', type: 'timestamp', nullable: true })
  otpExpiresAt: Date;

  @Column({ name: 'isOtpVerified', default: false })
  isOtpVerified: boolean;

  @Column({ length: 50, default: 'CLIENT' })
  role: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}


