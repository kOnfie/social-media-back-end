import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/modules/user/user.module';
import { SessionModule } from 'src/modules/session/session.module';
import { MailModule } from 'src/common/providers/mail/mail.module';
import { AuthSessionCookies } from './auth-session-cookies.service';

@Module({
  imports: [UserModule, SessionModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService, AuthSessionCookies],
})
export class AuthModule {}
