import { User } from 'src/modules/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export enum FollowStatus {
  ACCEPTED = 'accepted',
  PENDING = 'pending',
}

@Entity('follows')
@Unique(['followee', 'follower'])
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: FollowStatus, default: FollowStatus.PENDING })
  status!: FollowStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.following, {
    onDelete: 'CASCADE',
  })
  follower!: User;

  @ManyToOne(() => User, (user) => user.followers, { onDelete: 'CASCADE' })
  followee!: User;
}
