import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { extractSessionToken } from 'src/common/http/extract-session-token';

import { SessionService } from 'src/modules/session/session.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();

    const sessionToken = extractSessionToken(request.cookies);

    if (!sessionToken) {
      throw new UnauthorizedException('Not authenticated');
    }

    const session =
      await this.sessionService.findValidSessionByToken(sessionToken);

    if (!session) {
      throw new UnauthorizedException('Session expired or invalid');
    }

    request['user'] = session.user;
    request['sessionToken'] = sessionToken;

    return true;
  }
}
