import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Device } from './device.entity';

@Entity('permissions')
export class Permission {
  @PrimaryColumn({ type: 'bigint', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @PrimaryColumn({ type: 'bigint', name: 'device_id' })
  deviceId: string;

  @ManyToOne(() => Device)
  @JoinColumn({ name: 'device_id' })
  device: Device;
}
