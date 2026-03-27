import { Test, TestingModule } from '@nestjs/testing';
import { AppMetricsService } from '../../metrics/metricsService';
import { Event } from '../entities/eventEntity';
import { EventStatus } from '../enums/eventStatus.enum';
import { EventsRepository } from '../eventsRepository';
import { ProcessorFactory } from '../processors/processorFactory';
import {
  BackgroundWorkerService,
  RETRY_DELAYS_MS,
} from './backgroundWorkerService';

describe('BackgroundWorkerService', () => {
  let worker: BackgroundWorkerService;
  let eventsRepository: jest.Mocked<EventsRepository>;
  let processorFactory: jest.Mocked<ProcessorFactory>;
  let metricsService: jest.Mocked<AppMetricsService>;

  const buildEvent = (): Event => ({
    id: 'evt-worker-001',
    eventId: 'client-evt-worker-001',
    source: 'test',
    type: 'invoice.paid',
    status: EventStatus.PENDING,
    payload: JSON.stringify({ invoiceId: 'INV-W01', amount: 50 }),
    traceId: 'trace-worker-111',
    errorMessage: null,
    processedAt: null,
    createdAt: new Date(),
    timestamp: new Date().toISOString(),
    retryCount: 0,
  });

  beforeEach(async () => {
    jest.useFakeTimers();

    const mockRepository = {
      updateStatus: jest.fn().mockResolvedValue(undefined),
      incrementRetryCount: jest.fn().mockResolvedValue(undefined),
      findByEventId: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      findAll: jest.fn(),
    };

    const mockProcessorFactory = {
      getProcessor: jest.fn(),
    };

    const mockMetricsService = {
      incrementReceived: jest.fn(),
      incrementProcessed: jest.fn(),
      incrementFailed: jest.fn(),
      getMetrics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackgroundWorkerService,
        { provide: EventsRepository, useValue: mockRepository },
        { provide: ProcessorFactory, useValue: mockProcessorFactory },
        { provide: AppMetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    worker = module.get<BackgroundWorkerService>(BackgroundWorkerService);
    eventsRepository = module.get(EventsRepository);
    processorFactory = module.get(ProcessorFactory);
    metricsService = module.get(AppMetricsService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('marks event as failed after all retries are exhausted', async () => {
    const event = buildEvent();
    const mockProcessor = {
      process: jest.fn().mockRejectedValue(new Error('Processing failed')),
    };
    processorFactory.getProcessor.mockReturnValue(mockProcessor);

    const handlePromise = worker.handleEventCreated(event);

    // Drain the microtask queue and advance fake timers for each retry delay
    // We need to flush promises between each timer advancement
    const flushAndAdvance = async (ms: number) => {
      // Drain all pending microtasks
      for (let i = 0; i < 10; i++) {
        await Promise.resolve();
      }
      jest.advanceTimersByTime(ms);
    };

    for (const delay of RETRY_DELAYS_MS) {
      await flushAndAdvance(delay);
    }

    // Final flush to let the last rejection propagate
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
    }

    await handlePromise;

    expect(eventsRepository.updateStatus).toHaveBeenCalledWith(
      event.id,
      EventStatus.FAILED,
      expect.objectContaining({ errorMessage: 'Processing failed' }),
    );
    expect(metricsService.incrementFailed).toHaveBeenCalled();
    expect(metricsService.incrementProcessed).not.toHaveBeenCalled();
  }, 15000);

  it('marks event as processed on success', async () => {
    const event = buildEvent();
    const mockProcessor = {
      process: jest.fn().mockResolvedValue(undefined),
    };
    processorFactory.getProcessor.mockReturnValue(mockProcessor);

    await worker.handleEventCreated(event);

    expect(eventsRepository.updateStatus).toHaveBeenCalledWith(
      event.id,
      EventStatus.PROCESSED,
      expect.objectContaining({ processedAt: expect.any(Date) }),
    );
    expect(metricsService.incrementProcessed).toHaveBeenCalled();
  });
});
