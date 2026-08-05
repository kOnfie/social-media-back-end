import { Exclude } from 'class-transformer';
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

  @OneToMany(() => Session, (session) => session.user)
  sessions!: Session[];

  @Column({ unique: true, nullable: true })
  username?: string;

  @Column({ nullable: true })
  displayName?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true, type: 'text' })
  bio?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  @Exclude()
  updatedAt!: Date;
}
