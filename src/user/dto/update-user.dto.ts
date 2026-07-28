import { IsBoolean, IsNotEmpty, Min } from 'class-validator';

export class UpdateUserDto {
  @IsNotEmpty()
  @Min(8)
  passwordHash!: string;

  @IsBoolean()
  isVerified!: boolean;
}
