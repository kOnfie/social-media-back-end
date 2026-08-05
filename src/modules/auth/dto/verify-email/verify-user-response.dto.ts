import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../user-response.dto';

export class VerifyUserResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;

  @ApiProperty({ example: 'User email verified' })
  message!: string;
}
