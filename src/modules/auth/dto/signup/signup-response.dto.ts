import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../../user/dto/response/user-response.dto';

export class SignupResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;

  message!: string;
}
