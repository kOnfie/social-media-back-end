import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { SignupUserDto } from './dto/signup-user.dto';
import { VerifyUserDto } from './dto/verify-user.dto';
import { ResendVerificationCodeDto } from './dto/resend-verification-code.dto';

import { UserResponseDto } from './dto/user-response.dto';
import { User } from 'src/user/entities/user.entity';
import { plainToInstance } from 'class-transformer';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Post('/verify-email')
  async verifyUser(@Body() verifyUserDto: VerifyUserDto) {
    const user = await this.authService.verifyUser(verifyUserDto);
    const response = this.toUserResponse(user);

    return { user: response, message: 'User email verified' };
  }

  @Post('/resend-verification-code')
  async resendVerificationCode(
    @Body() resendCodeDto: ResendVerificationCodeDto,
  ) {
    await this.authService.resendVerificationCode(resendCodeDto);

    return { message: 'Code sent if email exists' };
  }
}
