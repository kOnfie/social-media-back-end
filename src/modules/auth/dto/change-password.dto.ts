import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @IsNotEmpty()
  @MinLength(8)
  newPassword!: string;
}
