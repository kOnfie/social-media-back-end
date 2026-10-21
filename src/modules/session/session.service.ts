import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Session } from './entities/session.entity';
import { MoreThan, Repository } from 'typeorm';
import * as crypto from 'crypto';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async createSession(userId: string): Promise<Session> {
    const token = crypto.randomBytes(32).toString('hex');

    const SESSION_DURATION_DAYS = 7;

    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + SESSION_DURATION_DAYS);

    const session = this.sessionRepository.create({
      token,
      expiredAt,
      user: { id: userId },
    });

    return this.sessionRepository.save(session);
  }

  async sessionIsValid(token: string): Promise<boolean> {
    const now = new Date();

    const session = await this.sessionRepository.findOneBy({
      token,
      expiredAt: MoreThan(now),
    });

    return !!session;
  }

  async findSessionByToken(token: string): Promise<Session | null> {
    const session = await this.sessionRepository.findOneBy({ token });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async findValidSessionByToken(token: string): Promise<Session | null> {
    const sessionList = await this.sessionRepository.find({
      where: { token },
      relations: { user: true },
    });
    const session = sessionList[0];

    if (!session) {
      return null;
    }

    const now = new Date();
    if (now.getTime() > session.expiredAt.getTime()) {
      await this.sessionRepository.delete({ token });
      return null;
    }

    return session;
  }

  async deleteSessionByToken(token: string): Promise<void> {
    await this.sessionRepository.delete({ token });
  }

  async deleteAllSessions(userId: string) {
    await this.sessionRepository.delete({ user: { id: userId } });
  }
}
