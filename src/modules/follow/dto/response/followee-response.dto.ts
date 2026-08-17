import { Expose, Type } from 'class-transformer';

import { FollowStatus } from '../../entities/follow.entity';
import { FollowUserResponseDto } from './follow-user-response.dto';

export class FolloweeResponseDto {
  @Expose()
  id!: string;

  @Expose()
  status!: FollowStatus;

  @Expose()
  @Type(() => FollowUserResponseDto)
  user!: FollowUserResponseDto;
}
