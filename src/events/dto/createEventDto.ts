import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsObject,
  IsString,
} from 'class-validator';
import { EventType } from '../enums/eventType.enum';

export class CreateEventDto {
  @ApiProperty({ example: 'evt-001', description: 'Client-provided unique event ID' })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({ example: 'betclicks-web', description: 'Event source system' })
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiProperty({
    example: 'invoice.paid',
    enum: EventType,
    description: 'Event type',
  })
  @IsIn(Object.values(EventType), {
    message: `type must be one of: ${Object.values(EventType).join(', ')}`,
  })
  type: EventType;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'ISO 8601 timestamp',
  })
  @IsISO8601()
  timestamp: string;

  @ApiProperty({
    example: { invoiceId: 'INV-123', amount: 150.0 },
    description: 'Event payload',
  })
  @IsObject()
  payload: Record<string, any>;
}
