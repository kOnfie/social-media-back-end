import { Module } from '@nestjs/common';
import { MAIL_PROVIDER_KEY } from './mail.interface';
import { ResendMailProvider } from './resend-mail.provider';

@Module({
  providers: [
    {
      provide: MAIL_PROVIDER_KEY,
      useClass: ResendMailProvider,
    },
  ],
  exports: [MAIL_PROVIDER_KEY],
})
export class MailModule {}
