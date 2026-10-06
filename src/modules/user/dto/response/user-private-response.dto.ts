import { Expose } from 'class-transformer';

export class UserPrivateResponseDto {
  @Expose()
  username!: string;

  @Expose()
  avatarUrl!: string;

  @Expose()
  followerCount!: number;

  @Expose()
  followeeCount!: number;
}
