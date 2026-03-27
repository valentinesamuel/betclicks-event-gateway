import { Logger } from '@nestjs/common';
import { Event } from '../entities/eventEntity';
import { EventStatus } from '../enums/eventStatus.enum';
import { UserRegisteredProcessor } from './userRegisteredProcessor';

describe('UserRegisteredProcessor', () => {
  let processor: UserRegisteredProcessor;

  beforeEach(() => {
    processor = new UserRegisteredProcessor();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const buildEvent = (): Event => ({
    id: 'test-evt-002',
    eventId: 'client-evt-002',
    source: 'test',
    type: 'user.registered',
    status: EventStatus.PENDING,
    payload: JSON.stringify({ userId: 'USR-001', email: 'alice@example.com' }),
    traceId: 'trace-xyz-456',
    errorMessage: null,
    processedAt: null,
    createdAt: new Date(),
    timestamp: new Date().toISOString(),
    retryCount: 0,
  });

  it('resolves without throwing for a valid event', async () => {
    await expect(processor.process(buildEvent())).resolves.toBeUndefined();
  });

  it('logs with traceId context', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log');
    const event = buildEvent();
    await processor.process(event);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(`traceId: ${event.traceId}`),
    );
  });
});
