import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENT_CREATED } from '../common/constants';
import { AppMetricsService } from '../metrics/metricsService';
import { CreateEventDto } from './dto/createEventDto';
import { QueryEventsDto } from './dto/queryEventsDto';
import { Event } from './entities/eventEntity';
import { EventStatus } from './enums/eventStatus.enum';
import { EventsRepository } from './eventsRepository';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly metricsService: AppMetricsService,
  ) {}

  async ingest(
    dto: CreateEventDto,
    traceId: string,
  ): Promise<{ event: Event; isNew: boolean }> {
    const existing = await this.eventsRepository.findByEventId(dto.eventId);
    if (existing) {
      this.logger.log(
        `[traceId: ${traceId}] Duplicate event eventId=${dto.eventId}, returning existing`,
      );
      return { event: existing, isNew: false };
    }

    const event = await this.eventsRepository.save({
      eventId: dto.eventId,
      source: dto.source,
      type: dto.type,
      timestamp: dto.timestamp,
      payload: JSON.stringify(dto.payload),
      status: EventStatus.PENDING,
      traceId,
    });

    this.metricsService.incrementReceived();
    this.logger.log(
      `[traceId: ${traceId}] Ingested new event id=${event.id}, emitting ${EVENT_CREATED}`,
    );
    this.eventEmitter.emit(EVENT_CREATED, event);

    return { event, isNew: true };
  }

  async findAll(
    query: QueryEventsDto,
  ): Promise<{ data: Event[]; total: number; limit: number; offset: number }> {
    const [data, total] = await this.eventsRepository.findAll(query);
    return {
      data: data.map((e) => ({ ...e, payload: JSON.parse(e.payload) })),
      total,
      limit: query.limit ?? 10,
      offset: query.offset ?? 0,
    };
  }

  async seed(): Promise<{ message?: string; count?: number; data?: Event[] }> {
    if (process.env.NODE_ENV === 'production') {
      return { message: 'Seeding is disabled in production' };
    }

    const count = await this.eventsRepository.count();
    if (count > 0) {
      return { message: 'Database already seeded', count };
    }

    const seedEvents: CreateEventDto[] = [
      {
        eventId: 'seed-evt-001',
        source: 'betclicks-web',
        type: 'invoice.paid' as any,
        timestamp: new Date('2024-01-01T10:00:00Z').toISOString(),
        payload: { invoiceId: 'INV-001', amount: 99.99, currency: 'USD' },
      },
      {
        eventId: 'seed-evt-002',
        source: 'betclicks-mobile',
        type: 'user.registered' as any,
        timestamp: new Date('2024-01-01T11:00:00Z').toISOString(),
        payload: { userId: 'USR-001', email: 'alice@example.com' },
      },
      {
        eventId: 'seed-evt-003',
        source: 'betclicks-web',
        type: 'invoice.paid' as any,
        timestamp: new Date('2024-01-01T12:00:00Z').toISOString(),
        payload: { invoiceId: 'INV-002', amount: 249.99, currency: 'EUR' },
      },
      {
        eventId: 'seed-evt-004',
        source: 'betclicks-api',
        type: 'user.registered' as any,
        timestamp: new Date('2024-01-01T13:00:00Z').toISOString(),
        payload: { userId: 'USR-002', email: 'bob@example.com', plan: 'pro' },
      },
      {
        eventId: 'seed-evt-005',
        source: 'betclicks-web',
        type: 'invoice.paid' as any,
        timestamp: new Date('2024-01-01T14:00:00Z').toISOString(),
        payload: { invoiceId: 'INV-003', amount: 49.99, currency: 'GBP' },
      },
    ];

    const traceId = 'seed-trace-000';
    const seeded: Event[] = [];
    for (const dto of seedEvents) {
      const { event } = await this.ingest(dto, traceId);
      seeded.push(event);
    }

    return { data: seeded };
  }
}
