import { Expose } from 'class-transformer';

export class UserPrivateResponseDto {
  @Expose()
  username!: string;

  @Expose()
  displayName!: string;

  @Expose()
  avatarUrl!: string;

  @Expose()
  bio!: string;

  @Expose()
  isPrivate!: boolean;

  @Expose()
  followerCount!: number;

  @Expose()
  followeeCount!: number;
}
