import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryEventsDto } from './dto/queryEventsDto';
import { Event } from './entities/eventEntity';
import { EventStatus } from './enums/eventStatus.enum';

@Injectable()
export class EventsRepository {
  constructor(
    @InjectRepository(Event)
    private readonly repo: Repository<Event>,
  ) {}

  async findByEventId(eventId: string): Promise<Event | null> {
    return this.repo.findOne({ where: { eventId } });
  }

  async save(event: Partial<Event>): Promise<Event> {
    return this.repo.save(event);
  }

  async updateStatus(
    id: string,
    status: EventStatus,
    extra: Partial<Event> = {},
  ): Promise<void> {
    await this.repo.update(id, { status, ...extra });
  }

  async incrementRetryCount(id: string, retryCount: number): Promise<void> {
    await this.repo.update(id, { retryCount });
  }

  async count(): Promise<number> {
    return this.repo.count();
  }

  async findAll(query: QueryEventsDto): Promise<[Event[], number]> {
    const qb = this.repo.createQueryBuilder('event');

    if (query.filter?.source) {
      qb.andWhere('event.source = :source', { source: query.filter.source });
    }
    if (query.filter?.type) {
      qb.andWhere('event.type = :type', { type: query.filter.type });
    }
    if (query.filter?.status) {
      qb.andWhere('event.status = :status', { status: query.filter.status });
    }

    const order =
      (query.sort?.createdAt?.toUpperCase() as 'ASC' | 'DESC') ?? 'ASC';
    qb.orderBy('event.createdAt', order)
      .skip(query.offset ?? 0)
      .take(query.limit ?? 10);

    return qb.getManyAndCount();
  }
}
