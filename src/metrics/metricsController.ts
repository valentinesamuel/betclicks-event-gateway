import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppMetricsService } from './metricsService';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: AppMetricsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get event processing metrics',
    description:
      'Returns in-memory counters for events received, processed, and failed. ' +
      'Counters reset on process restart.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current metric counters.',
    schema: {
      example: {
        metrics: { received: 10, processed: 8, failed: 2 },
        traceId: 'e5f6a7b8-c9d0-1234-efab-345678901234',
        durationMs: 1,
        path: '/metrics',
      },
    },
  })
  getMetrics() {
    return { metrics: this.metricsService.getMetrics() };
  }
}
