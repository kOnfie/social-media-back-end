import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

export enum ConfirmFollowStatus {
  ACCEPT = 'accept',
  REJECT = 'reject',
}

export class ConfirmSubscriptionDto {
  @IsUUID()
  @IsNotEmpty()
  followId!: string;

  @IsEnum(ConfirmFollowStatus)
  @IsNotEmpty()
  status!: ConfirmFollowStatus;
}
