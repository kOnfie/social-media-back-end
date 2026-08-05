import type { Request, Response } from 'express';

import {
  Body,
  Controller,
  Get,
  HttpCode,
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
import { ResendVerificationCodeDto } from './dto/resend-code/resend-verification-code.dto';
import { LoginUserDto } from './dto/login/login-user.dto';
import { SignupUserDto } from './dto/signup/signup-user.dto';
import { VerifyUserDto } from './dto/verify-email/verify-user.dto';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ConfigService } from '@nestjs/config';
import { extractResetToken } from 'src/common/http/extract-reset-token';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SignupResponseDto } from './dto/signup/signup-response.dto';
import { ConflictResponseDto } from './dto/conflict-response.dto';
import { VerifyUserResponseDto } from './dto/verify-email/verify-user-response.dto';
import { ResendCodeResponseDto } from './dto/resend-code/resend-code-response.dto';
import { LoginUserResponseDto } from './dto/login/login-user-response.dto';

@ApiTags('Auth')
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
  @ApiOperation({
    summary: 'Signup user',
    description:
      'Signup user by email and password. Returns user object and send verification code to email for verification. Request needs email + password (length is not less than 8 characters)',
  })
  @ApiBody({ type: SignupUserDto })
  @ApiResponse({
    status: 201,
    description: 'User created and verifiaction code sent to email',
    type: SignupResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict in signup',
    type: ConflictResponseDto,
  })
  async signupUser(@Body() signupUserDto: SignupUserDto) {
    const user = await this.authService.signupUser(signupUserDto);
    const formattedUser = this.toUserResponse(user);

    return { user: formattedUser, message: 'User created' };
  }

  @Post('/verify-email')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Verify email',
    description: 'Verify user email after signup by verification code',
  })
  @ApiBody({ type: VerifyUserDto })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully, session cookie updated',
    type: VerifyUserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict error',
    type: ConflictResponseDto,
  })
  async verifyUser(
    @Res({ passthrough: true }) res: Response,
    @Body() verifyUserDto: VerifyUserDto,
  ): Promise<VerifyUserResponseDto> {
    const { user, token } = await this.authService.verifyUser(verifyUserDto);
    const formattedUser = this.toUserResponse(user);

    this.authSessionCookies.setSessionCookie(res, token);

    return { user: formattedUser, message: 'Email verified successfully' };
  }

  @Post('/resend-verification-code')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Resend verification code to email',
    description: 'If code did not send, user can resend new code to email',
  })
  @ApiBody({ type: ResendVerificationCodeDto })
  @ApiResponse({
    status: 409,
    description: 'Conflict error',
    type: ConflictResponseDto,
  })
  async resendVerificationCode(
    @Body() resendCodeDto: ResendVerificationCodeDto,
  ): Promise<ResendCodeResponseDto> {
    await this.authService.resendVerificationCode(resendCodeDto);

    return { message: 'Code sent if email exists' };
  }

  @Post('/login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Login into account',
    description:
      'Login into account by email + password (length is not less than 8 characters)',
  })
  @ApiBody({ type: ResendVerificationCodeDto })
  @ApiResponse({
    status: 409,
    description: 'Conflict error',
    type: ConflictResponseDto,
  })
  async loginUser(
    @Res({ passthrough: true }) res: Response,
    @Body() loginUserDto: LoginUserDto,
  ): Promise<LoginUserResponseDto> {
    const { user, token } = await this.authService.loginUser(loginUserDto);
    const userResponse = this.toUserResponse(user);

    this.authSessionCookies.setSessionCookie(res, token);

    return { user: userResponse, message: 'User loggined in' };
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
  @Post('/logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionToken = req.sessionToken as string;

    await this.authService.logout(sessionToken);

    this.authSessionCookies.clearSessionCookie(res);

    return { message: 'User logged out' };
  }

  @UseGuards(SessionAuthGuard)
  @Get('/me')
  getMe(@CurrentUser() user: User) {
    return this.toUserResponse(user ?? null);
  }
}
