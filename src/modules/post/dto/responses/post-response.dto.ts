import { Expose, Type } from 'class-transformer';

export class PostUserResponse {
  @Expose()
  id!: string;

  @Expose()
  username!: string;

  @Expose()
  displayName!: string;

  @Expose()
  avatarUrl!: string;

  @Expose()
  isPrivate!: boolean;
}

export class PostResponseDto {
  @Expose()
  id!: string;

  @Expose()
  text!: string;

  @Expose()
  photoUrl!: string;

  @Expose()
  updatedAt!: Date;

  @Expose()
  createdAt!: Date;

  @Expose()
  @Type(() => PostUserResponse)
  user!: PostUserResponse;
}
