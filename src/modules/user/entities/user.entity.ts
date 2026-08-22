import { Exclude } from 'class-transformer';
import { Follow } from 'src/modules/follow/entities/follow.entity';
import { Post } from 'src/modules/post/entities/post.entity';
import { Session } from 'src/modules/session/entities/session.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  @Exclude()
  passwordHash!: string;

  @Column({ default: false })
  isVerified!: boolean;

  @Column({ unique: true, nullable: true })
  username?: string;

  @Column({ nullable: true })
  displayName?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true, type: 'text' })
  bio?: string;

  @Column({ nullable: true, default: false })
  isPrivate?: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  @Exclude()
  updatedAt!: Date;

  @OneToMany(() => Session, (session) => session.user)
  sessions!: Session[];

  @OneToMany(() => Follow, (follow) => follow.follower)
  following!: Follow[];

  @OneToMany(() => Follow, (follow) => follow.followee)
  followers!: Follow[];

  @OneToMany(() => Post, (post) => post.user)
  posts!: Post[];
}
