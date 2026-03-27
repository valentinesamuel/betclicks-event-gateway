import { Logger } from '@nestjs/common';
import { Event } from '../entities/eventEntity';
import { EventStatus } from '../enums/eventStatus.enum';
import { InvoicePaidProcessor } from './invoicePaidProcessor';

describe('InvoicePaidProcessor', () => {
  let processor: InvoicePaidProcessor;

  beforeEach(() => {
    processor = new InvoicePaidProcessor();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const buildEvent = (): Event => ({
    id: 'test-evt-001',
    eventId: 'client-evt-001',
    source: 'test',
    type: 'invoice.paid',
    status: EventStatus.PENDING,
    payload: JSON.stringify({ invoiceId: 'INV-001', amount: 99.99 }),
    traceId: 'trace-abc-123',
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
