import { Test, TestingModule } from '@nestjs/testing';
import { EventType } from '../enums/eventType.enum';
import { InvoicePaidProcessor } from './invoicePaidProcessor';
import { ProcessorFactory } from './processorFactory';
import { UserRegisteredProcessor } from './userRegisteredProcessor';

describe('ProcessorFactory', () => {
  let factory: ProcessorFactory;
  let invoicePaidProcessor: InvoicePaidProcessor;
  let userRegisteredProcessor: UserRegisteredProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessorFactory,
        {
          provide: InvoicePaidProcessor,
          useValue: { process: jest.fn() },
        },
        {
          provide: UserRegisteredProcessor,
          useValue: { process: jest.fn() },
        },
      ],
    }).compile();

    factory = module.get<ProcessorFactory>(ProcessorFactory);
    invoicePaidProcessor = module.get<InvoicePaidProcessor>(InvoicePaidProcessor);
    userRegisteredProcessor = module.get<UserRegisteredProcessor>(UserRegisteredProcessor);
  });

  it('returns InvoicePaidProcessor for invoice.paid', () => {
    const processor = factory.getProcessor(EventType.INVOICE_PAID);
    expect(processor).toBe(invoicePaidProcessor);
  });

  it('returns UserRegisteredProcessor for user.registered', () => {
    const processor = factory.getProcessor(EventType.USER_REGISTERED);
    expect(processor).toBe(userRegisteredProcessor);
  });

  it('throws for unknown event type', () => {
    expect(() => factory.getProcessor('unknown.type' as EventType)).toThrow(
      'No processor registered for event type: unknown.type',
    );
  });
});
