import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Response } from 'express';
import { TraceId } from '../common/decorators/traceId.decorator';
import { CreateEventDto } from './dto/createEventDto';
import { QueryEventsDto } from './dto/queryEventsDto';
import { Event } from './entities/eventEntity';
import { EventsService } from './eventsService';

@ApiTags('events')
@ApiHeader({
  name: 'x-trace-id',
  description: 'Optional client-provided trace ID. If omitted, one is generated server-side.',
  required: false,
  example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
})
@ApiExtraModels(Event)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({
    summary: 'Ingest a new event',
    description:
      'Accepts an event and saves it as `pending`. Processing happens asynchronously via the background worker. ' +
      'Returns `201` for new events and `200` for duplicate IDs (idempotent).',
  })
  @ApiBody({ type: CreateEventDto })
  @ApiResponse({
    status: 201,
    description: 'Event accepted and queued for processing.',
    schema: {
      example: {
        statusCode: 201,
        isNew: true,
        event: {
          id: 'evt-001',
          source: 'betclicks-web',
          type: 'invoice.paid',
          status: 'pending',
          payload: { invoiceId: 'INV-123', amount: 150.0, currency: 'USD' },
          traceId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          errorMessage: null,
          processedAt: null,
          createdAt: '2024-01-15T10:30:00.123Z',
          timestamp: '2024-01-15T10:30:00.000Z',
          retryCount: 0,
        },
        traceId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        durationMs: 12,
        path: '/events',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Duplicate — event with this ID already exists. No side effects.',
    schema: {
      example: {
        statusCode: 200,
        isNew: false,
        event: {
          id: 'evt-001',
          source: 'betclicks-web',
          type: 'invoice.paid',
          status: 'processed',
          payload: { invoiceId: 'INV-123', amount: 150.0, currency: 'USD' },
          traceId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          errorMessage: null,
          processedAt: '2024-01-15T10:30:01.456Z',
          createdAt: '2024-01-15T10:30:00.123Z',
          timestamp: '2024-01-15T10:30:00.000Z',
          retryCount: 0,
        },
        traceId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        durationMs: 5,
        path: '/events',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error — one or more required fields are missing or invalid.',
    schema: {
      example: {
        statusCode: 400,
        message: 'source must be a string, type must be one of: invoice.paid, user.registered',
        error: 'Bad Request',
        traceId: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        durationMs: 2,
        timestamp: '2024-01-15T10:30:01.000Z',
      },
    },
  })
  async ingest(
    @Body() dto: CreateEventDto,
    @TraceId() traceId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { event, isNew } = await this.eventsService.ingest(dto, traceId);
    const payload = JSON.parse(event.payload);
    res.status(isNew ? HttpStatus.CREATED : HttpStatus.OK);
    return {
      statusCode: isNew ? HttpStatus.CREATED : HttpStatus.OK,
      isNew,
      event: { ...event, payload },
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Query events',
    description:
      'Returns a paginated list of events. Use bracket notation for filters and sort: ' +
      '`filter[type]`, `filter[source]`, `filter[status]`, `sort[createdAt]`.',
  })
  @ApiQuery({ name: 'filter[type]', required: false, enum: ['invoice.paid', 'user.registered'], description: 'Filter by event type' })
  @ApiQuery({ name: 'filter[source]', required: false, type: String, description: 'Filter by source system' })
  @ApiQuery({ name: 'filter[status]', required: false, enum: ['pending', 'processing', 'processed', 'failed'], description: 'Filter by processing status' })
  @ApiQuery({ name: 'sort[createdAt]', required: false, enum: ['asc', 'desc'], description: 'Sort direction (default: asc)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (default: 10, min: 1)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of records to skip (default: 0)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of events.',
    schema: {
      example: {
        data: [
          {
            id: 'evt-001',
            source: 'betclicks-web',
            type: 'invoice.paid',
            status: 'processed',
            payload: { invoiceId: 'INV-123', amount: 150.0 },
            traceId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            errorMessage: null,
            processedAt: '2024-01-15T10:30:01.456Z',
            createdAt: '2024-01-15T10:30:00.123Z',
            timestamp: '2024-01-15T10:30:00.000Z',
            retryCount: 0,
          },
        ],
        total: 1,
        limit: 10,
        offset: 0,
        traceId: 'd4e5f6a7-b8c9-0123-defa-234567890123',
        durationMs: 8,
        path: '/events',
      },
    },
  })
  async findAll(@Query() query: QueryEventsDto) {
    return this.eventsService.findAll(query);
  }

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed dummy data',
    description:
      'Inserts 5 sample events covering both event types. ' +
      'No-op if the table already has rows or if `NODE_ENV` is `production`.',
  })
  @ApiResponse({
    status: 200,
    description: 'Seed completed or skipped.',
    schema: {
      oneOf: [
        {
          title: 'Seeded',
          example: {
            data: [
              { id: 'seed-evt-001', type: 'invoice.paid', status: 'pending' },
              { id: 'seed-evt-002', type: 'user.registered', status: 'pending' },
            ],
            traceId: 'e5f6a7b8-c9d0-1234-efab-345678901234',
            durationMs: 45,
            path: '/events/seed',
          },
        },
        {
          title: 'Already seeded',
          example: {
            message: 'Database already seeded',
            count: 5,
            traceId: 'f6a7b8c9-d0e1-2345-fabc-456789012345',
            durationMs: 3,
            path: '/events/seed',
          },
        },
      ],
    },
  })
  async seed() {
    return this.eventsService.seed();
  }
}
