import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListOutboxEventsQueryDto {
  @ApiPropertyOptional({ enum: ['pending', 'processing', 'dispatched', 'failed'] })
  @IsOptional()
  @IsIn(['pending', 'processing', 'dispatched', 'failed'])
  status?: 'pending' | 'processing' | 'dispatched' | 'failed';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  queue?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
