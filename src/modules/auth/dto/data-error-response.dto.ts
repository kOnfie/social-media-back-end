import { ApiProperty } from '@nestjs/swagger';

export class DataErrorResponseDto {
  @ApiProperty({ example: 'Invalid credentials', description: 'Error message' })
  'message': string;

  @ApiProperty({ example: 'Conflict', description: 'Error title' })
  'error': string;

  @ApiProperty({ example: 409, description: 'Conflic status code' })
  'statusCode': number;
}
