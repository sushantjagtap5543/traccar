import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('billing_plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // "Monthly", "Half-Yearly", "Yearly"

  @Column({ nullable: true })
  slug: string; // "1month", "6month", "12month"

  @Column('decimal')
  amount: number;

  @Column({ default: 'INR' })
  currency: string;

  @Column({ default: 0 })
  validityMonths: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
