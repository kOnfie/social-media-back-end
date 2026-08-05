import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UserResponseDto } from './dto/response/user-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UserPresenter {
  toResponse(user: User | null): UserResponseDto {
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
