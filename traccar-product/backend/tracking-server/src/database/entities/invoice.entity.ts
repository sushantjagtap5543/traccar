import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Subscription } from './subscription.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Subscription)
  subscription: Subscription;

  @Column()
  subscriptionId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'pending' })
  status: string; // pending, paid, cancelled

  @CreateDateColumn()
  createdAt: Date;
}
