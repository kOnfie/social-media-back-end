import { ApiProperty } from '@nestjs/swagger';

class DataError {
  @ApiProperty({ example: 'User not found', description: 'Error message' })
  'message': string;

  @ApiProperty({ example: 'Not found', description: 'Error title' })
  'error': string;

  @ApiProperty({ example: 404, description: 'Not found status code' })
  'statusCode': number;
}

export class NotFoundResponseDto {
  @ApiProperty({ example: 404, description: 'Not found status code' })
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

  @ApiProperty({ type: DataError })
  data!: DataError;
}
