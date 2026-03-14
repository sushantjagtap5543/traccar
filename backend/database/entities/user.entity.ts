import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Client } from './client.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  clientId: string;

  @ManyToOne(() => Client, (client) => client.users)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ nullable: true })
  name: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true })
  mobile: string;

  @Column({ nullable: true })
  company: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true, select: false })
  password?: string;

  @Column({ default: false })
  isOtpVerified: boolean;

  @Column({ nullable: true })
  otpCode: string;

  @Column({ nullable: true })
  otpExpiresAt: Date;

  @Column({ default: 'CLIENT' })
  role: string; // 'ADMIN' or 'CLIENT'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
