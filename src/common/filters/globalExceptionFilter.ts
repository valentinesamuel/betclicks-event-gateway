import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const startTime = (host.switchToHttp().getRequest())._startTime || Date.now();
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string;
    let error: string;

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        const r = response as any;
        message = Array.isArray(r.message)
          ? r.message.join(', ')
          : r.message || exception.message;
        error = r.error || exception.name;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    } else {
      message = 'Internal server error';
      error = 'InternalServerError';
    }

    this.logger.error(
      `[traceId: ${req.traceId}] ${statusCode} ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    res.status(statusCode).json({
      statusCode,
      message,
      error,
      traceId: req.traceId,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  }
}
