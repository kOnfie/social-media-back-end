import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { UserPresenter } from './user.presenter';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserResponseDto } from './dto/response/user-response.dto';

import { UserConflictResponseDto } from './dto/error-response/user-conflict-response.dto';
import { UserPublicResponseDto } from './dto/response/user-public-response.dto';
import { NotFoundResponseDto } from './dto/error-response/not-found-response.dto';
import { UserPrivateResponseDto } from './dto/response/user-private-response.dto';

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

  @Patch('/me/update')
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

  @Get(':id')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get public user info',
    description: 'Get public user info by id',
  })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Get public profile',
  //   type: UserPublicResponseDto,
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Get private profile',
  //   type: UserPrivateResponseDto,
  // })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: NotFoundResponseDto,
  })
  async getPublicProfileById(
    @Param('id') userId: string,
  ): Promise<UserPublicResponseDto | UserPrivateResponseDto> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isPrivate) {
      return this.userPresenter.toPrivateResponse(user);
    } else {
      return this.userPresenter.toPublicResponse(user);
    }
  }

  @Get('/username/:username')
  async getUserByUsername(
    @Param('username') username: string,
  ): Promise<UserResponseDto> {
    const user = await this.userService.findUserByUsername(username);
    return this.userPresenter.toResponse(user);
  }
}
