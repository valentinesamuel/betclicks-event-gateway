import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          this.logger.log(
            `[traceId: ${req.traceId}] ${method} ${url} ${res.statusCode} — ${Date.now() - start}ms`,
          );
        },
        error: (err) => {
          this.logger.error(
            `[traceId: ${req.traceId}] ${method} ${url} ${err.status ?? 500} — ${Date.now() - start}ms`,
          );
        },
      }),
    );
  }
}
