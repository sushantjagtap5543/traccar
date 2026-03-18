import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('tactical_documents')
export class TacticalDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  deviceId: string;

  @Column()
  userId: string;

  @Column()
  title: string;

  @Column()
  type: string; // "Insurance", "Permit", "License", "Service Record"

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ name: 'expiresAt', type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
