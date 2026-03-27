import { Injectable } from '@nestjs/common';

/**
 * In-memory metrics tracker.
 *
 * NOTE: These counters reset on process restart and do not scale horizontally.
 * A production-grade alternative would derive metrics from the database:
 *   SELECT status, COUNT(*) FROM event GROUP BY status
 * This approach survives restarts, scales across instances, and is always consistent.
 */
@Injectable()
export class AppMetricsService {
  private received = 0;
  private processed = 0;
  private failed = 0;

  incrementReceived(): void {
    this.received++;
  }

  incrementProcessed(): void {
    this.processed++;
  }

  incrementFailed(): void {
    this.failed++;
  }

  getMetrics(): { received: number; processed: number; failed: number } {
    return {
      received: this.received,
      processed: this.processed,
      failed: this.failed,
    };
  }
}
