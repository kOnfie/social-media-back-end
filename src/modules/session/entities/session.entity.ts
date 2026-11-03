import { User } from 'src/modules/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true, unique: true })
  token!: string;

  @ManyToOne(() => User, (user) => user.sessions, {
    onDelete: 'CASCADE',
  })
  user!: User;

  @RelationId((session: Session) => session.user)
  userId!: string;

  @Column({ type: 'timestamptz', nullable: true })
  expiredAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
