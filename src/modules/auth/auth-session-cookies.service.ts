import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

@Injectable()
export class AuthSessionCookies {
  constructor(private readonly configService: ConfigService) {}

  setSessionCookie(res: Response, sessionToken: string) {
    const PROD_ENV = this.configService.get<string>('NODE_ENV') === 'prod';

    res.cookie('sessionToken', sessionToken, {
      httpOnly: true,
      secure: PROD_ENV,
      sameSite: 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
  }

  clearSessionCookie(res: Response) {
    res.clearCookie('sessionToken', {
      path: '/',
    });
  }
}
