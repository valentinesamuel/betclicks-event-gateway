import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { EventStatus } from '../enums/eventStatus.enum';
import { EventType } from '../enums/eventType.enum';

export class FilterDto {
  @ApiPropertyOptional({ enum: EventType })
  @IsOptional()
  @IsIn(Object.values(EventType))
  type?: EventType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}

export class SortDto {
  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  createdAt?: 'asc' | 'desc';
}

export class QueryEventsDto {
  @ApiPropertyOptional({ type: FilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterDto)
  filter?: FilterDto;

  @ApiPropertyOptional({ type: SortDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SortDto)
  sort?: SortDto;

  @ApiPropertyOptional({ default: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
