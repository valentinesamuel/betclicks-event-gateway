import { Module } from '@nestjs/common';
import { MetricsController } from './metricsController';
import { AppMetricsService } from './metricsService';

@Module({
  providers: [AppMetricsService],
  controllers: [MetricsController],
  exports: [AppMetricsService],
})
export class MetricsModule {}
