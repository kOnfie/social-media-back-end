import { ApiProperty } from '@nestjs/swagger';
import { DataErrorResponseDto } from './data-error-response.dto';

export class ConflictResponseDto {
  @ApiProperty({ example: 409, description: 'Conflic status code' })
  statusCode!: number;

  @ApiProperty({
    example: '2026-08-04T14:16:49.704Z',
    description: 'Date and time of the error',
  })
  timestamp!: Date;

  @ApiProperty({
    example: '/api/v1/',
    description: 'Path when error was catch',
  })
  path!: string;

  @ApiProperty({ type: DataErrorResponseDto })
  data!: DataErrorResponseDto;
}
