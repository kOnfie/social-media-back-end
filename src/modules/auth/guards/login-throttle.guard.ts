import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

interface LoginRequest {
  ip?: string;
  body?: { email?: unknown };
}

@Injectable()
export class LoginThrottleGuard extends ThrottlerGuard {
  // eslint-disable-next-line @typescript-eslint/require-await
  protected async getTracker(req: LoginRequest): Promise<string> {
    const email = req.body?.email;

    return typeof email === 'string'
      ? `login${email.toLowerCase()}`
      : (req.ip ?? 'unknown');
  }
}
