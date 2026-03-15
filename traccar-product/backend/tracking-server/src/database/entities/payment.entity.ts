import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column({ nullable: true })
  orderId: string;

  @Column({ nullable: true })
  paymentId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'INR' })
  currency: string;

  @Column({ default: 'pending' })
  status: string; // pending, captured, failed

  @Column({ type: 'json', nullable: true })
  attributes: any;

  @CreateDateColumn()
  createdAt: Date;
}
