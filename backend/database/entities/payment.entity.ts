import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ precision: 10, scale: 2, type: 'decimal' })
  amount: number;

  @Column()
  currency: string;

  @Column({ unique: true })
  orderId: string;

  @Column({ nullable: true })
  paymentId: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  attributes: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
