import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { IMailProvider } from './mail.interface';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ResendMailProvider implements IMailProvider {
  private readonly logger = new Logger(ResendMailProvider.name);
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService) {
    const RESEND_API_KEY = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(RESEND_API_KEY);
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to,
      subject,
      html,
    });

    if (error) {
      this.logger.error(`Failed to send letter to ${to}`, error);
      throw new InternalServerErrorException('Failed to send letter to email');
    }
  }
}
