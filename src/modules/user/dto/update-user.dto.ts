import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string;
}
