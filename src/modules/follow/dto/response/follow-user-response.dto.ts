import { Expose } from 'class-transformer';

export class FollowUserResponseDto {
  @Expose()
  id!: string;

  @Expose()
  username!: string;

  @Expose()
  displayName!: string;

  @Expose()
  avatarUrl!: string;
}
