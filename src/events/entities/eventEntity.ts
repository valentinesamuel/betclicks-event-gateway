import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
 
} from 'typeorm';
import { EventStatus } from '../enums/eventStatus.enum';
import { EventType } from '../enums/eventType.enum';

@Entity('event')
export class Event {
  @ApiProperty({ example: '252456-326456-2fvw45t-4w5y3245', description: 'Client-provided unique event ID' })
 @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ example: 'evt-001', description: 'Client-provided unique event ID' })
  @Column({unique: true})
  eventId:string

  @ApiProperty({ example: 'betclicks-web', description: 'System that originated the event' })
  @Column()
  source: string;

  @ApiProperty({ enum: EventType, example: EventType.INVOICE_PAID })
  @Column()
  type: string;

  @ApiProperty({ enum: EventStatus, example: EventStatus.PENDING })
  @Column({ default: EventStatus.PENDING })
  status: EventStatus;

  @ApiProperty({
    description: 'Freeform event payload (stored as JSON)',
    example: { invoiceId: 'INV-123', amount: 150.0, currency: 'USD' },
  })
  @Column('text')
  payload: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Column()
  traceId: string;

  @ApiPropertyOptional({ example: 'Processing failed: timeout', nullable: true })
  @Column({ nullable: true })
  errorMessage: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:01.456Z', nullable: true })
  @Column({ nullable: true, type: 'datetime' })
  processedAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.123Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: 'Client-provided ISO 8601 timestamp' })
  @Column()
  timestamp: string;

  @ApiProperty({ example: 0, description: 'Number of processing retries attempted' })
  @Column({ default: 0 })
  retryCount: number;
}
