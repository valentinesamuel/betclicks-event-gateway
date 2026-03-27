import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { GlobalExceptionFilter } from '../src/common/filters/globalExceptionFilter';
import { TraceIdMiddleware } from '../src/common/middleware/traceIdMiddleware';
import { ResponseInterceptor } from '../src/common/interceptors/responseInterceptor';
import { Event } from '../src/events/entities/eventEntity';
import { EventsModule } from '../src/events/eventsModule';
import { MetricsModule } from '../src/metrics/metricsModule';

describe('Events E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [Event],
          synchronize: true,
        }),
        EventEmitterModule.forRoot(),
        EventsModule,
        MetricsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.use((req, res, next) => {
      new TraceIdMiddleware().use(req, res, next);
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const validEvent = {
    eventId: 'e2e-evt-001',
    source: 'betclicks-test',
    type: 'invoice.paid',
    timestamp: new Date().toISOString(),
    payload: { invoiceId: 'INV-E2E-001', amount: 99.99 },
  };

  it('Test 1: POST /events with valid body → 201, event saved as pending', async () => {
    const res = await request(app.getHttpServer())
      .post('/events')
      .send(validEvent)
      .expect(201);

    expect(res.body.isNew).toBe(true);
    expect(res.body.event).toMatchObject({
      eventId: validEvent.eventId,
      source: validEvent.source,
      status: 'pending',
    });
    expect(res.body.traceId).toBeDefined();
  });

  it('Test 2: Same id twice → first 201, second 200 (idempotency)', async () => {
    const duplicateEvent = {
      eventId: 'e2e-evt-duplicate',
      source: 'betclicks-test',
      type: 'user.registered',
      timestamp: new Date().toISOString(),
      payload: { userId: 'USR-DUP-001' },
    };

    const firstRes = await request(app.getHttpServer())
      .post('/events')
      .send(duplicateEvent)
      .expect(201);
    expect(firstRes.body.isNew).toBe(true);

    const secondRes = await request(app.getHttpServer())
      .post('/events')
      .send(duplicateEvent)
      .expect(200);
    expect(secondRes.body.isNew).toBe(false);
  });

  it('Test 3: Missing required fields → 400 Bad Request', async () => {
    const res = await request(app.getHttpServer())
      .post('/events')
      .send({ eventId: 'incomplete-event' })
      .expect(400);

    expect(res.body.statusCode).toBe(400);
    expect(res.body.traceId).toBeDefined();
  });
});
