import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from 'src/modules/user/dto/response/user-response.dto';
import { FollowStatus } from '../../entities/follow.entity';

export class FollowResponseDto {
  @Expose()
  id!: string;

  @Expose()
  status!: FollowStatus;

  @Expose()
  @Type(() => UserResponseDto)
  follower!: UserResponseDto;

  @Expose()
  @Type(() => UserResponseDto)
  followee!: UserResponseDto;
}
