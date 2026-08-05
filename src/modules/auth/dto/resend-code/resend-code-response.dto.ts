import { ApiProperty } from '@nestjs/swagger';

export class ResendCodeResponseDto {
  @ApiProperty({ example: 'Code sent if email exists' })
  message!: string;
}
