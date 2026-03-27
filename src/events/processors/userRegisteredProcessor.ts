import { Injectable, Logger } from '@nestjs/common';
import { Event } from '../entities/eventEntity';
import { IEventProcessor } from './eventProcessor.interface';

@Injectable()
export class UserRegisteredProcessor implements IEventProcessor {
  private readonly logger = new Logger(UserRegisteredProcessor.name);

  async process(event: Event): Promise<void> {
    this.logger.log(
      `[traceId: ${event.traceId}] Processing user.registered event id=${event.id}`,
    );
    const payload = JSON.parse(event.payload);
    this.logger.log(
      `[traceId: ${event.traceId}] User registered — userId=${payload.userId ?? 'N/A'}, email=${payload.email ?? 'N/A'}`,
    );
    // Business logic: send welcome email, provision account, etc.
  }
}
