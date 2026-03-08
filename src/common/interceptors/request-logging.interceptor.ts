import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { createStructuredLog } from '../observability/logger';
import { httpRequestDuration, httpRequestTotal } from '../observability/metrics';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startedAt;
        const durationSeconds = durationMs / 1000;

        // Record metrics
        const route = req.route?.path ?? req.originalUrl;
        httpRequestDuration.observe(
          { method: req.method, route, status_code: res.statusCode },
          durationSeconds,
        );
        httpRequestTotal.inc({ method: req.method, route, status_code: res.statusCode });

        // Log request
        const payload = createStructuredLog('info', 'http_request', {
          request_id: req.requestId,
          method: req.method,
          path: req.originalUrl,
          status_code: res.statusCode,
          duration_ms: durationMs,
        });
        this.logger.log(JSON.stringify(payload));
      }),
    );
  }
}
