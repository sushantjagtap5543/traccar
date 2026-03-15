import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ length: 128, nullable: true })
  type: string;

  @Column({ type: 'jsonb', nullable: true })
  attributes: any;

  @Column({ default: false })
  always: boolean;
}
