import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class SignupUserDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
