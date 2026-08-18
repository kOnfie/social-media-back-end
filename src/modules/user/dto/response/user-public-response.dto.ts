import { Expose } from 'class-transformer';

export class UserPublicResponseDto {
  @Expose()
  email!: string;

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
