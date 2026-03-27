import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { TraceIdMiddleware } from './common/middleware/traceIdMiddleware';
import { EventsModule } from './events/eventsModule';
import { Event } from './events/entities/eventEntity';
import { HealthModule } from './health/healthModule';
import { MetricsModule } from './metrics/metricsModule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('nodeEnv');
        const isTest = nodeEnv === 'test';
        return {
          type: 'better-sqlite3',
          database: isTest
            ? ':memory:'
            : configService.get<string>('databasePath'),
          entities: [Event],
          synchronize: isTest,
          migrationsRun: !isTest,
          migrations: isTest ? [] : ['dist/migrations/*.js'],
        };
      },
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot(),
    EventsModule,
    MetricsModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TraceIdMiddleware).forRoutes('*');
  }
}
