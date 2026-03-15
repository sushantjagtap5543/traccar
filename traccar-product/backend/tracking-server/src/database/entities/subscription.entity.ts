import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Plan } from './plan.entity';
import { Client } from './client.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  imei: string;

  @ManyToOne(() => Client, { nullable: true })
  client: Client;

  @Column({ nullable: true })
  clientId: number;

  @ManyToOne(() => Plan, { nullable: true })
  plan: Plan;

  @Column({ nullable: true })
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
