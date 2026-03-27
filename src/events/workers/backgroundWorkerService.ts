import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENT_CREATED } from '../../common/constants';
import { AppMetricsService } from '../../metrics/metricsService';
import { Event } from '../entities/eventEntity';
import { EventStatus } from '../enums/eventStatus.enum';
import { EventType } from '../enums/eventType.enum';
import { ProcessorFactory } from '../processors/processorFactory';
import { EventsRepository } from '../eventsRepository';

export const MAX_RETRIES = 3;
export const RETRY_DELAYS_MS = [1000, 2000, 4000];

@Injectable()
export class BackgroundWorkerService {
  private readonly logger = new Logger(BackgroundWorkerService.name);

  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly processorFactory: ProcessorFactory,
    private readonly metricsService: AppMetricsService,
  ) {}

  @OnEvent(EVENT_CREATED, { async: true })
  async handleEventCreated(event: Event): Promise<void> {
    this.logger.log(
      `[traceId: ${event.traceId}] Worker picked up event id=${event.id}`,
    );

    await this.eventsRepository.updateStatus(event.id, EventStatus.PROCESSING);

    try {
      await this.processWithRetry(event);
      await this.eventsRepository.updateStatus(
        event.id,
        EventStatus.PROCESSED,
        { processedAt: new Date() },
      );
      this.metricsService.incrementProcessed();
      this.logger.log(
        `[traceId: ${event.traceId}] Event id=${event.id} processed successfully`,
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await this.eventsRepository.updateStatus(event.id, EventStatus.FAILED, {
        errorMessage,
      });
      this.metricsService.incrementFailed();
      this.logger.error(
        `[traceId: ${event.traceId}] Event id=${event.id} failed permanently: ${errorMessage}`,
      );
    }
  }

  async processWithRetry(event: Event): Promise<void> {
    const processor = this.processorFactory.getProcessor(event.type as EventType);
    let lastError: Error;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        await processor.process(event);
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < MAX_RETRIES) {
          this.logger.warn(
            `[traceId: ${event.traceId}] Event id=${event.id} attempt ${attempt + 1} failed, retrying in ${RETRY_DELAYS_MS[attempt]}ms: ${lastError.message}`,
          );
          await this.eventsRepository.incrementRetryCount(event.id, attempt + 1);
          await this.sleep(RETRY_DELAYS_MS[attempt]);
        }
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
