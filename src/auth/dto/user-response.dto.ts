import { Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id!: string;

  @Expose()
  email!: string;

  @Expose()
  isVerified!: boolean;

  @Expose()
  createdAt!: Date;
}
