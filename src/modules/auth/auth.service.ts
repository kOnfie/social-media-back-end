import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignupUserDto } from './dto/signup/signup-user.dto';

import { UserService } from 'src/modules/user/user.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { generateVerificationCode } from 'src/common/utils/generateVerificationCode';
import { createHash } from 'crypto';
import {
  type IMailProvider,
  MAIL_PROVIDER_KEY,
} from 'src/common/providers/mail/mail.interface';

import { User } from 'src/modules/user/entities/user.entity';
import { VerifyUserDto } from './dto/verify-email/verify-user.dto';
import { ResendVerificationCodeDto } from './dto/resend-code/resend-verification-code.dto';
import { SessionService } from 'src/modules/session/session.service';
import { LoginUserDto } from './dto/login/login-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Session } from '../session/entities/session.entity';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(MAIL_PROVIDER_KEY) private mailProvider: IMailProvider,
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  private async saveVerificationCode(
    email: string,
    ttl: number = 600_000,
  ): Promise<number> {
    const verificationCode = generateVerificationCode();
    const hashedCode = createHash('sha256')
      .update(String(verificationCode))
      .digest('hex'); // ???

    await this.cacheManager.set(`verification:${email}`, hashedCode, ttl);

    return verificationCode;
  }

  private async saveResetPasswordCode(
    email: string,
    ttl: number = 600_000,
  ): Promise<number> {
    const code = generateVerificationCode();
    const hashCode = createHash('sha256').update(String(code)).digest('hex'); // ???

    await this.cacheManager.set(`reset-password-code:${email}`, hashCode, ttl);

    return code;
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

  private async sendResetCodeToEmail(email: string): Promise<void> {
    const code = await this.saveResetPasswordCode(email);

    const subject = 'Reset password verification code';
    const html = `<div>
     <h1>Socail Media App. Glad to see you :)</h1>
     <p>You sent the request to reset password. It is your verification code: <b>${code}</b></p>
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
        const saltRounds = Number(
          this.configService.get<number>('SALT_ROUNDS') ?? 12,
        );
        const newPasswordHash = await bcrypt.hash(password, saltRounds);

        await this.userService.updateUserPasswordHash(
          userExists.id,
          newPasswordHash,
        );
        const updatedUser = await this.userService.findByEmail(email);

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

  async loginUser(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    const userExists = await this.userService.findByEmail(email);
    if (!userExists || !userExists.isVerified) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordIsCorrect = await bcrypt.compare(
      password,
      userExists.passwordHash,
    );

    if (!passwordIsCorrect) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const session = await this.sessionService.createSession(userExists.id);

    return { user: userExists, token: session.token };
  }

  async verifyUser(verifyUserDto: VerifyUserDto) {
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
      await this.userService.updateUserVerifyByEmail(email, true);

      await this.cacheManager.del(`verification:${email}`);
    } catch (error) {
      this.logger.error(
        `[authService.verifyUser] Failed to update the user ${email}`,
        error,
      );
      throw new InternalServerErrorException('Failed to updated the user');
    }

    const user = await this.userService.findByEmail(email);
    if (!user) {
      this.logger.error(
        `[authService.verifyUserEmail] User not found by email ${email}`,
      );
      throw new InternalServerErrorException('User not found');
    }

    const session = await this.sessionService.createSession(user?.id);

    return { user, token: session.token };
  }

  async resendVerificationCode(resendCodeDto: ResendVerificationCodeDto) {
    // todo: add exception when user already verified

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

  async changePassword(
    changePasswordDto: ChangePasswordDto,
    userId: string,
  ): Promise<Session> {
    const { password, newPassword } = changePasswordDto;

    if (password === newPassword) {
      throw new BadRequestException('New password must be different');
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordsHaveMatch = await bcrypt.compare(
      password,
      user.passwordHash,
    );
    if (!passwordsHaveMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const saltRounds = Number(
      this.configService.get<number>('SALT_ROUNDS') ?? 12,
    );

    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    const token = crypto.randomBytes(32).toString('hex');

    const SESSION_DURATION_DAYS = 7;
    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + SESSION_DURATION_DAYS);

    return this.dataSource.transaction(async (manager) => {
      await manager.update(
        User,
        { id: userId },
        { passwordHash: newPasswordHash },
      );

      await manager.delete(Session, { user: { id: userId } });

      const session = manager.create(Session, {
        token,
        expiredAt,
        user: { id: userId },
      });

      return manager.save(Session, session);
    });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;

    const userExists = await this.userService.findByEmail(email);
    if (userExists && userExists.isVerified) {
      await this.sendResetCodeToEmail(email);
    }
  }

  async verifyResetCode(verifyResetCodeDto: VerifyResetCodeDto) {
    const { email, code } = verifyResetCodeDto;

    const savedHashCode = await this.cacheManager.get(
      `reset-password-code:${email}`,
    );
    if (!savedHashCode) {
      throw new NotFoundException('Code expired or not exitst');
    }
    await this.cacheManager.del(`reset-password-code:${email}`);

    const hashCode = createHash('sha256').update(String(code)).digest('hex');
    if (hashCode !== savedHashCode) {
      throw new BadRequestException('Codes do not match');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    const ttl = 300_000; // 5 mins
    await this.cacheManager.set(
      `reset-password-token:${email}`,
      resetToken,
      ttl,
    );

    return { resetToken };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    resetToken: string | null,
  ) {
    const { email, newPassword } = resetPasswordDto;

    const savedResetToken = await this.cacheManager.get(
      `reset-password-token:${email}`,
    );

    if (!savedResetToken || !resetToken || resetToken !== savedResetToken) {
      throw new BadRequestException('You need to do email verification');
    }

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const passwordsAreMatch = await bcrypt.compare(
      newPassword,
      user.passwordHash,
    );
    if (passwordsAreMatch) {
      throw new BadRequestException('Password cannot be the same');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    const token = crypto.randomBytes(32).toString('hex');

    const SESSION_DURATION_DAYS = 7;
    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + SESSION_DURATION_DAYS);

    const newSession = await this.dataSource.transaction(async (manager) => {
      await manager.update(
        User,
        {
          id: user.id,
        },
        { passwordHash: newPasswordHash },
      );

      await manager.delete(Session, { user: { id: user.id } });

      const session = manager.create(Session, {
        token,
        expiredAt,
        user: { id: user.id },
      });
      return await manager.save(Session, session);
    });

    await this.cacheManager.del(`reset-password-token:${email}`);

    return { token: newSession.token, user };
  }

  async logout(token: string) {
    return this.sessionService.deleteSessionByToken(token);
  }
}
