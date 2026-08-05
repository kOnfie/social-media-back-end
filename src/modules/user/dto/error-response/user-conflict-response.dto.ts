import { ApiProperty } from '@nestjs/swagger';
import { UserErrorResponseDto } from './user-error-response.dto';

export class UserConflictResponseDto {
  @ApiProperty({ example: 409, description: 'Conflic status code' })
  statusCode!: number;

  @ApiProperty({
    example: '2026-08-04T14:16:49.704Z',
    description: 'Date and time of the error',
  })
  timestamp!: Date;

  @ApiProperty({
    example: '/api/v1/',
    description: 'Path where the error was caught',
  })
  path!: string;

  @ApiProperty({ type: UserErrorResponseDto })
  data!: UserErrorResponseDto;
}
