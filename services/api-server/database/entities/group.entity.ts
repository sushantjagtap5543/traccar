import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ length: 128 })
  name: string;

  @Column({ type: 'bigint', nullable: true })
  groupId: string;

  @ManyToOne(() => Group, (group) => group.children)
  @JoinColumn({ name: 'groupId' })
  parent: Group;

  @OneToMany(() => Group, (group) => group.parent)
  children: Group[];

  @Column({ type: 'jsonb', nullable: true })
  attributes: any;
}
