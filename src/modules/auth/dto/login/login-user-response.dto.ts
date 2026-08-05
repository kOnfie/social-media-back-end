import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../../user/dto/response/user-response.dto';

export class LoginUserResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;

  @ApiProperty({ example: 'User loggined in' })
  message!: string;
}
