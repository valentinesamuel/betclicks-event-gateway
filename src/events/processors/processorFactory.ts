import { Injectable } from '@nestjs/common';
import { EventType } from '../enums/eventType.enum';
import { IEventProcessor } from './eventProcessor.interface';
import { InvoicePaidProcessor } from './invoicePaidProcessor';
import { UserRegisteredProcessor } from './userRegisteredProcessor';

@Injectable()
export class ProcessorFactory {
  constructor(
    private readonly invoicePaidProcessor: InvoicePaidProcessor,
    private readonly userRegisteredProcessor: UserRegisteredProcessor,
  ) {}

  getProcessor(type: EventType): IEventProcessor {
    switch (type) {
      case EventType.INVOICE_PAID:
        return this.invoicePaidProcessor;
      case EventType.USER_REGISTERED:
        return this.userRegisteredProcessor;
      default:
        throw new Error(`No processor registered for event type: ${type}`);
    }
  }
}
