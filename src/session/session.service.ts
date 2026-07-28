import { Injectable } from '@nestjs/common';
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
}
