import { Exclude } from 'class-transformer';
import { Session } from 'src/session/entities/session.entity';
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
  email?: string;

  @Column({ select: false })
  @Exclude()
  passwordHash?: string;

  @Column({ default: false })
  isVerified!: boolean;

  @OneToMany(() => Session, (session) => session.user)
  sessions!: Session[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn({ select: false })
  @Exclude()
  updatedAt!: Date;
}
