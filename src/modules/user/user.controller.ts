import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { UserPresenter } from './user.presenter';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { UserResponseDto } from './dto/response/user-response.dto';

import { UserConflictResponseDto } from './dto/error-response/user-conflict-response.dto';

@UseGuards(AuthGuard)
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userPresenter: UserPresenter,
  ) {}

  @Get('/me')
  getMe(@CurrentUser() user: User): UserResponseDto {
    return this.userPresenter.toResponse(user);
  }

  @Post('/me/update')
  @HttpCode(200)
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 409,
    description: 'Conflict response, uset not found',
    type: UserConflictResponseDto,
  })
  async updateMe(
    @CurrentUser('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.updateUser(userId, updateUserDto);

    if (!user) {
      throw new ConflictException('User not found');
    }

    return this.userPresenter.toResponse(user);
  }
}
