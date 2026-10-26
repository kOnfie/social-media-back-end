import { IsBoolean } from 'class-validator';

export class UpdateUserPrivacyDto {
  @IsBoolean()
  isPrivate!: boolean;
}
