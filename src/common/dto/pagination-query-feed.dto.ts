import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class PaginationQueryFeedDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  cursorCreatedAt?: Date;

  @IsOptional()
  @IsUUID()
  cursorId?: string;
}
