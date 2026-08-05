import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UserResponseDto } from './dto/response/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { UserPublicResponseDto } from './dto/response/user-public-response.dto';
import { UserPrivateResponseDto } from './dto/response/user-private-response.dto';

@Injectable()
export class UserPresenter {
  toResponse(user: User | null): UserResponseDto {
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  toPublicResponse(user: User | null): UserPublicResponseDto {
    return plainToInstance(UserPublicResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  toPrivateResponse(user: User | null): UserPrivateResponseDto {
    return plainToInstance(UserPrivateResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
