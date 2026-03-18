import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('hardware_whitelist')
export class HardwareWhitelist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  imeiPrefix: string; // e.g., "8697" or "357"

  @Column({ nullable: true })
  vendor: string; // "Teltonika", "Concox", etc.

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
