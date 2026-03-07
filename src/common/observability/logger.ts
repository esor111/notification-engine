export type LogContext = {
  trace_id?: string;
  span_id?: string;
  request_id?: string;
  [key: string]: string | number | boolean | undefined;
};

export function createStructuredLog(
  level: 'info' | 'warn' | 'error',
  message: string,
  ctx: LogContext = {},
) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: process.env.OTEL_SERVICE_NAME ?? 'backend-api',
    ...ctx,
  };
}
