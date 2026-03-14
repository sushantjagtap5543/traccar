import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('approved_devices')
export class ApprovedDevice {
  @PrimaryColumn()
  imei: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  batch: string;

  @CreateDateColumn()
  createdAt: Date;
}
