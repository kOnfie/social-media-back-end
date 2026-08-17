import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Follow } from './entities/follow.entity';

import { FolloweeResponseDto } from './dto/response/followee-response.dto';
import { FollowerResponseDto } from './dto/response/follower-response.dto';
import { FollowResponseDto } from './dto/response/follow-response.dto';

@Injectable()
export class FollowPresenter {
  toResponse(follow: Follow | null): FollowResponseDto {
    return plainToInstance(FollowResponseDto, follow, {
      excludeExtraneousValues: true,
    });
  }

  toFollowerResponse(follow: Follow | null): FollowerResponseDto {
    return plainToInstance(FollowerResponseDto, follow, {
      excludeExtraneousValues: true,
    });
  }

  toFolloweeResponse(follow: Follow | null): FolloweeResponseDto {
    return plainToInstance(FolloweeResponseDto, follow, {
      excludeExtraneousValues: true,
    });
  }
}
