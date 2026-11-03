import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Session } from './entities/session.entity';
import { EntityManager, Repository } from 'typeorm';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { JwtService } from '@nestjs/jwt';
import { CachedSession } from './types/cached-session.type';

const SESSION_DURATION_DAYS = 7;

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private jwtService: JwtService,
  ) {}

  private getCacheKey(token: string) {
    return `user-session:${token}`;
  }

  private async addSessionIntoCache(
    token: string,
    cachedSession: CachedSession,
  ) {
    const ttl = cachedSession.expiredAt.getTime() - Date.now();

    // ttl 0 means "never expire" in Keyv, so expired sessions must not be cached
    if (ttl <= 0) {
      return;
    }

    await this.cacheManager.set(this.getCacheKey(token), cachedSession, ttl);
  }

  private async findSessionFromStore(
    token: string,
  ): Promise<CachedSession | null> {
    const sessionFromCache: CachedSession | undefined =
      await this.cacheManager.get(this.getCacheKey(token));

    // entries without userId are from the old cache format, treat them as a miss
    if (sessionFromCache?.userId) {
      return {
        userId: sessionFromCache.userId,
        expiredAt: new Date(sessionFromCache.expiredAt),
      };
    }

    const session = await this.sessionRepository.findOneBy({ token });
    if (!session) {
      return null;
    }

    const cachedSession: CachedSession = {
      userId: session.userId,
      expiredAt: session.expiredAt,
    };
    await this.addSessionIntoCache(token, cachedSession);

    return cachedSession;
  }

  async createSession(userId: string): Promise<Session> {
    const payload = { id: userId };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: `${SESSION_DURATION_DAYS}d`,
    });

    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + SESSION_DURATION_DAYS);

    const session = this.sessionRepository.create({
      token,
      expiredAt,
      user: { id: userId },
    });

    const savedSession = await this.sessionRepository.save(session);

    await this.addSessionIntoCache(token, { userId, expiredAt });

    return savedSession;
  }

  async findValidSessionByToken(token: string): Promise<CachedSession | null> {
    const session = await this.findSessionFromStore(token);

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
    await this.cacheManager.del(this.getCacheKey(token));
  }

  async deleteAllSessionsInTransaction(manager: EntityManager, userId: string) {
    const deletedResult = await manager
      .createQueryBuilder()
      .delete()
      .from(Session)
      .where('"userId" = :userId', { userId })
      .returning('token')
      .execute();

    type RowType = { token: string };
    const rows = deletedResult.raw as RowType[];
    return rows.map((row) => row.token);
  }

  async deleteAllSessionsFromCache(tokens: string[]) {
    const keys = tokens.map((token) => this.getCacheKey(token));
    await this.cacheManager.mdel(keys);
  }

  async createSessionInTransaction(manager: EntityManager, userId: string) {
    const payload = { id: userId };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: `${SESSION_DURATION_DAYS}d`,
    });

    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + SESSION_DURATION_DAYS);

    return manager.create(Session, {
      token,
      expiredAt,
      user: { id: userId },
    });
  }
}
