import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserResponseDto {
  // @ApiProperty({
  //   example: '9104607b-942d-4eeb-8eb4-0b48f39473e6',
  //   description: 'User id',
  // })
  @Expose()
  id!: string;

  // @ApiProperty({
  //   example: 'matveevdenis458@gmail.com',
  //   description: 'User email',
  // })
  @Expose()
  email!: string;

  // @ApiProperty({
  //   example: 'true',
  //   description: 'User is verified or not',
  // })
  @Expose()
  isVerified!: boolean;

  // @ApiProperty({
  //   example: '2026-08-04 17:07:58.506726',
  //   description: 'Date the resource was created',
  // })
  @Expose()
  createdAt!: Date;
}
