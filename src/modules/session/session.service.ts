import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Session } from './entities/session.entity';
import { MoreThan, Repository } from 'typeorm';
import * as crypto from 'crypto';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRespository: Repository<Session>,
  ) {}

  async createSession(userId: string): Promise<Session> {
    const token = crypto.randomBytes(32).toString('hex');

    const SESSION_DURATION_DAYS = 7;

    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + SESSION_DURATION_DAYS);

    const session = this.sessionRespository.create({
      token,
      expiredAt,
      user: { id: userId },
    });

    return this.sessionRespository.save(session);
  }

  async sessionIsValid(token: string): Promise<boolean> {
    const now = new Date();

    const session = await this.sessionRespository.findOneBy({
      token,
      expiredAt: MoreThan(now),
    });

    return !!session;
  }

  async findSessionByToken(token: string): Promise<Session | null> {
    const session = await this.sessionRespository.findOneBy({ token });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async findValidSessionByToken(token: string): Promise<Session | null> {
    const session = await this.sessionRespository.findOne({
      where: { token },
      relations: { user: true },
    });
    if (!session) {
      return null;
    }

    const now = new Date();
    if (now.getTime() > session.expiredAt.getTime()) {
      await this.sessionRespository.delete({ token });
      return null;
    }

    return session;
  }

  async deleteSessionByToken(token: string): Promise<void> {
    await this.sessionRespository.delete({ token });
  }

  async deleteAllSessions(userId: string) {
    await this.sessionRespository.delete({ user: { id: userId } });
  }
}
