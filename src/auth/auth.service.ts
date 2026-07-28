import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SignupUserDto } from './dto/signup-user.dto';

import { UserService } from 'src/user/user.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import * as bcrypt from 'bcrypt';
import { generateVerificationCode } from 'src/common/utils/generateVerificationCode';
import { createHash } from 'crypto';
import {
  type IMailProvider,
  MAIL_PROVIDER_KEY,
} from 'src/common/providers/mail/mail.interface';

import { User } from 'src/user/entities/user.entity';
import { VerifyUserDto } from './dto/verify-user.dto';
import { ResendVerificationCodeDto } from './dto/resend-verification-code.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(MAIL_PROVIDER_KEY) private mailProvider: IMailProvider,
    private readonly userService: UserService,
  ) {}

  private async saveVerificationCode(
    email: string,
    ttl: number = 600_000,
  ): Promise<number> {
    const verificationCode = generateVerificationCode();
    const hashedCode = createHash('sha256')
      .update(String(verificationCode))
      .digest('hex');

    await this.cacheManager.set(`verification:${email}`, hashedCode, ttl);

    return verificationCode;
  }

  private async sendVerificationCodeToEmail(email: string): Promise<void> {
    const verificationCode = await this.saveVerificationCode(email);

    const subject = 'Verification code';
    const html = `<div>
            <h1>Socail Media App. Glad to see you :)</h1>
            <p>Your verification code: <b>${verificationCode}</b></p>
          </div>`;

    await this.mailProvider.send(email, subject, html);
  }

  async signupUser(signupUserDto: SignupUserDto): Promise<User | null> {
    const { email, password } = signupUserDto;

    const userExists = await this.userService.findByEmail(email);

    if (userExists) {
      if (userExists.isVerified) {
        throw new ConflictException('Invalid credentials');
      } else {
        const rounds = 12;
        const newPasswordHash = await bcrypt.hash(password, rounds);

        const updatedUser = await this.userService.updateUser(userExists.id, {
          passwordHash: newPasswordHash,
        });

        try {
          await this.sendVerificationCodeToEmail(email);
        } catch (error: unknown) {
          if (error instanceof Error) {
            this.logger.warn(
              `[signupUser.service] Name: ${error.name} Message: ${error.message} Email: ${email}`,
            );
          } else {
            this.logger.warn(
              `[signupUser.service] received non-Error throwable Email: ${email}`,
            );
          }
        }

        return updatedUser;
      }
    }

    const newUser = await this.userService.createUser(email, password);

    try {
      await this.sendVerificationCodeToEmail(email);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.warn(
          `[signupUser.service] Name: ${error.name} Message: ${error.message} Email: ${email}`,
        );
      } else {
        this.logger.warn(
          `[signupUser.service] received non-Error throwable Email: ${email}`,
        );
      }
    }

    return newUser;
  }

  async verifyUser(verifyUserDto: VerifyUserDto): Promise<User | null> {
    const { email, code } = verifyUserDto;

    const verificationCodeHash = await this.cacheManager.get(
      `verification:${email}`,
    );
    if (!verificationCodeHash) {
      throw new ConflictException('Code has expired');
    }

    const inputCodeHash = createHash('sha256').update(code).digest('hex');

    if (verificationCodeHash !== inputCodeHash) {
      throw new ConflictException('Code is invalid');
    }

    try {
      await this.userService.updateUserByEmail(email, {
        isVerified: true,
      });
      await this.cacheManager.del(`verification:${email}`);
    } catch (error) {
      this.logger.error(
        `[authService.verifyUser] Failed to update the user ${email}`,
        error,
      );
      throw new InternalServerErrorException('Failed to updated the user');
    }

    return this.userService.findByEmail(email);
  }

  async resendVerificationCode(resendCodeDto: ResendVerificationCodeDto) {
    const { email } = resendCodeDto;

    const userExists = await this.userService.findByEmail(email);
    if (!userExists) {
      throw new ConflictException('Invalid credentials');
    }

    try {
      await this.sendVerificationCodeToEmail(email);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.warn(
          `[authService.resendEmailCode] Name: ${error.name} Message: ${error.message} Email: ${email}`,
        );
      } else {
        this.logger.warn(
          `[authService.resendEmailCode] received non-Error throwable Email: ${email}`,
        );
      }
    }
  }
}
