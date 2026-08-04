import type { Request, Response } from 'express';

import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { AuthService } from './auth.service';
import { AuthSessionCookies } from './auth-session-cookies.service';

import { User } from 'src/modules/user/entities/user.entity';

import { UserResponseDto } from './dto/user-response.dto';
import { ResendVerificationCodeDto } from './dto/resend-verification-code.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { SignupUserDto } from './dto/signup-user.dto';
import { VerifyUserDto } from './dto/verify-user.dto';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ConfigService } from '@nestjs/config';
import { extractResetToken } from 'src/common/http/extract-reset-token';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authSessionCookies: AuthSessionCookies,
    private readonly configService: ConfigService,
  ) {}

  private toUserResponse(user: User | null): UserResponseDto {
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Post('/signup')
  async signupUser(@Body() signupUserDto: SignupUserDto) {
    const user = await this.authService.signupUser(signupUserDto);
    const response = this.toUserResponse(user);

    return { user: response, message: 'User created' };
  }

  @Post('/login')
  async loginUser(
    @Res({ passthrough: true }) res: Response,
    @Body() loginUserDto: LoginUserDto,
  ) {
    const { user, token } = await this.authService.loginUser(loginUserDto);
    const userResponse = this.toUserResponse(user);

    this.authSessionCookies.setSessionCookie(res, token);

    return { user: userResponse, message: 'User loggined in' };
  }

  @Post('/verify-email')
  async verifyUser(
    @Res({ passthrough: true }) res: Response,
    @Body() verifyUserDto: VerifyUserDto,
  ) {
    const { user, token } = await this.authService.verifyUser(verifyUserDto);
    const formattedUser = this.toUserResponse(user);

    this.authSessionCookies.setSessionCookie(res, token);

    return { user: formattedUser, message: 'User email verified' };
  }

  @Post('/resend-verification-code')
  async resendVerificationCode(
    @Body() resendCodeDto: ResendVerificationCodeDto,
  ) {
    await this.authService.resendVerificationCode(resendCodeDto);

    return { message: 'Code sent if email exists' };
  }

  @UseGuards(SessionAuthGuard)
  @Post('/logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionToken = req.sessionToken as string;

    await this.authService.logout(sessionToken);

    this.authSessionCookies.clearSessionCookie(res);

    return { message: 'User logged out' };
  }

  @UseGuards(SessionAuthGuard)
  @Post('/change-password')
  async changePassword(
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const session = await this.authService.changePassword(
      changePasswordDto,
      user.id,
    );

    this.authSessionCookies.setSessionCookie(res, session.token);

    return {
      user: this.toUserResponse(user),
      message: 'Password changed successfully',
    };
  }

  @Post('/forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);

    return { message: 'If this email exists, a code has been sent' };
  }

  @Post('/verify-reset-code')
  async verifyResetCode(
    @Res({ passthrough: true }) res: Response,
    @Body() verifyResetCodeDto: VerifyResetCodeDto,
  ) {
    const PROD_ENV = this.configService.get('NODE_ENV') === 'prod';
    const { resetToken } =
      await this.authService.verifyResetCode(verifyResetCodeDto);

    const HOUR_IN_MS = 1000 * 60 * 60;

    res.cookie('resetToken', resetToken, {
      httpOnly: true,
      secure: PROD_ENV,
      sameSite: 'lax',
      path: '/',
      maxAge: HOUR_IN_MS,
    });

    return { message: 'Email verified' };
  }

  @Post('/reset-password')
  async resetPassword(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    const resetToken = extractResetToken(req.cookies);

    const { token, user } = await this.authService.resetPassword(
      resetPasswordDto,
      resetToken,
    );

    this.authSessionCookies.setSessionCookie(res, token);

    return {
      user: this.toUserResponse(user),
      message: 'Password updated',
    };
  }

  @UseGuards(SessionAuthGuard)
  @Get('/me')
  getMe(@CurrentUser() user: User) {
    return this.toUserResponse(user ?? null);
  }
}
