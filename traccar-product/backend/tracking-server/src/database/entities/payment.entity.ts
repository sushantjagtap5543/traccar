import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  invoiceId: number;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  method: string; // razorpay, paypal, bank_transfer

  @Column({ default: 'pending' })
  status: string; // pending, success, failed

  @CreateDateColumn()
  createdAt: Date;
}
