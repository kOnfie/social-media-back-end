import { Expose, Type } from 'class-transformer';

import { FollowStatus } from '../../entities/follow.entity';
import { FollowUserResponseDto } from './follow-user-response.dto';

export class FollowerResponseDto {
  @Expose()
  id!: string;

  @Expose()
  status!: FollowStatus;

  @Expose()
  isFollowee!: boolean;

  @Expose()
  @Type(() => FollowUserResponseDto)
  user!: FollowUserResponseDto;
}
