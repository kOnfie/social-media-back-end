import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class VerifyResetCodeDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @Length(6)
  code!: string;
}
