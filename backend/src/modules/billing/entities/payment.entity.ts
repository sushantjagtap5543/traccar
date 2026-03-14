import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string; // Razorpay order ID

  @Column({ nullable: true })
  paymentId: string; // Razorpay payment ID

  @Column()
  amount: number;

  @Column()
  currency: string;

  @Column({ default: 'pending' })
  status: string; // pending, captured, failed

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'jsonb', nullable: true })
  attributes: object;

  @CreateDateColumn()
  createdAt: Date;
}
