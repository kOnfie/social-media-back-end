import { IsEmail, IsNotEmpty, Length, MinLength } from 'class-validator';

export class VerifyUserDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @Length(6)
  code!: string;

  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
