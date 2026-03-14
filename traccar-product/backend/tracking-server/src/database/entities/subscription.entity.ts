import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Plan } from './plan.entity';
import { Client } from './client.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Client)
  client: Client;

  @Column()
  clientId: number;

  @ManyToOne(() => Plan)
  plan: Plan;

  @Column()
  planId: number;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column({ default: 'active' })
  status: string; // active, expired, cancelled

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
