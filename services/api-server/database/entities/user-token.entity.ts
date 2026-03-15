import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_tokens')
export class UserToken {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', name: 'userid', nullable: true })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userid' })
  user: User;

  @Column({ length: 256, nullable: true })
  token: string;

  @CreateDateColumn({ name: 'createdat' })
  createdAt: Date;
}
