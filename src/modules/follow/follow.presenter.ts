import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Follow } from './entities/follow.entity';
import { FollowResponseDto } from './dto/response/follow-response.dto';

@Injectable()
export class FollowPresenter {
  toResponse(follow: Follow | null): FollowResponseDto {
    return plainToInstance(FollowResponseDto, follow, {
      excludeExtraneousValues: true,
    });
  }
}
