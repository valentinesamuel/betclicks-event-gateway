import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import { AppModule } from './appModule';
import { GlobalExceptionFilter } from './common/filters/globalExceptionFilter';
import { LoggingInterceptor } from './common/interceptors/loggingInterceptor';
import { ResponseInterceptor } from './common/interceptors/responseInterceptor';

async function bootstrap() {
  fs.mkdirSync('./data', { recursive: true });

  const app = await NestFactory.create(AppModule);
  // Express 5 changed the default query parser to 'simple', which doesn't support
  // bracket notation (filter[source]). Switch back to 'extended' (qs) so that
  // GET /events?filter[source]=x is parsed as { filter: { source: 'x' } }.
  app.getHttpAdapter().getInstance().set('query parser', 'extended');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('BetClicks Event Gateway')
    .setDescription(
      `Event ingestion and async processing service.\n\n` +
      `**Flow:** \`POST /events\` → saved as \`pending\` → background worker picks it up → ` +
      `\`ProcessorFactory\` routes by type → status transitions to \`processed\` or \`failed\`.\n\n` +
      `**Tracing:** every request generates a \`traceId\` (UUID v4) returned in the \`x-trace-id\` ` +
      `response header and included in every response body and log line.`,
    )
    .setVersion('1.0')
    .addServer('http://localhost:3000', 'Local development')
    .addTag('events', 'Event ingestion, querying, and seed operations')
    .addTag('metrics', 'In-memory processing counters')
    .addTag('health', 'Database health check')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;
  await app.listen(port);
  console.log(`Application running on http://localhost:${port}`);
  console.log(`Swagger docs:          http://localhost:${port}/api`);
}

bootstrap();
