import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class VerifyUserDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @Length(6)
  code!: string;
}
