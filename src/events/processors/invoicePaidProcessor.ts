import { Injectable, Logger } from '@nestjs/common';
import { Event } from '../entities/eventEntity';
import { IEventProcessor } from './eventProcessor.interface';

@Injectable()
export class InvoicePaidProcessor implements IEventProcessor {
  private readonly logger = new Logger(InvoicePaidProcessor.name);

  async process(event: Event): Promise<void> {
    this.logger.log(
      `[traceId: ${event.traceId}] Processing invoice.paid event id=${event.id}`,
    );
    const payload = JSON.parse(event.payload);
    this.logger.log(
      `[traceId: ${event.traceId}] Invoice paid — invoiceId=${payload.invoiceId ?? 'N/A'}, amount=${payload.amount ?? 'N/A'}`,
    );
    // Business logic: notify billing system, update invoice records, etc.
  }
}
