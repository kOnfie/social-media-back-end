export interface IMailProvider {
  send(to: string, subject: string, html: string): Promise<void>;
}

export const MAIL_PROVIDER_KEY = 'MAIL_PROVIDER_KEY';
