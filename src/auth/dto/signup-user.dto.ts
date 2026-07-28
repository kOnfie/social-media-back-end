import { IsEmail, IsNotEmpty, Min } from 'class-validator';

export class SignupUserDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @Min(8)
  password!: string;
}
