import { Event } from '../entities/eventEntity';

export interface IEventProcessor {
  process(event: Event): Promise<void>;
}
