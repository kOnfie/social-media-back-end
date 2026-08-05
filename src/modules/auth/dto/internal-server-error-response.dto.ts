import { ApiProperty } from '@nestjs/swagger';

export class InternalServerErrorResponseDto {
  @ApiProperty({
    example: 500,
    description: 'Internal server error status code',
  })
  statusCode!: number;

  @ApiProperty({
    example: '2026-08-04T14:16:49.704Z',
    description: 'Date and time of the error',
  })
  timestamp!: Date;

  @ApiProperty({
    example: '/api/v1/**',
    description: 'Path where the error was caught',
  })
  path!: string;

  @ApiProperty({
    example: 'Internal server error',
    description: 'Error message',
  })
  data!: string;
}
