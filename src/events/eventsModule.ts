import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetricsModule } from '../metrics/metricsModule';
import { Event } from './entities/eventEntity';
import { EventsController } from './eventsController';
import { EventsRepository } from './eventsRepository';
import { EventsService } from './eventsService';
import { InvoicePaidProcessor } from './processors/invoicePaidProcessor';
import { ProcessorFactory } from './processors/processorFactory';
import { UserRegisteredProcessor } from './processors/userRegisteredProcessor';
import { BackgroundWorkerService } from './workers/backgroundWorkerService';

@Module({
  imports: [TypeOrmModule.forFeature([Event]), MetricsModule],
  controllers: [EventsController],
  providers: [
    EventsService,
    EventsRepository,
    BackgroundWorkerService,
    ProcessorFactory,
    InvoicePaidProcessor,
    UserRegisteredProcessor,
  ],
})
export class EventsModule {}
