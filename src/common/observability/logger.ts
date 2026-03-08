import { createLogger, format, transports } from 'winston';
import LokiTransport from 'winston-loki';

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

// Winston logger for structured logging to Loki
export const logger = createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json(),
  ),
  defaultMeta: {
    service: process.env.OTEL_SERVICE_NAME ?? 'backend-api',
    environment: process.env.NODE_ENV ?? 'development',
  },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `${timestamp} [${level}] ${message} ${metaStr}`;
        }),
      ),
    }),
  ],
});

// Add Loki transport if URL is configured and not in test
if (process.env.LOKI_URL && process.env.NODE_ENV !== 'test') {
  logger.add(
    new LokiTransport({
      host: process.env.LOKI_URL,
      labels: {
        service: process.env.OTEL_SERVICE_NAME ?? 'backend-api',
        environment: process.env.NODE_ENV ?? 'development',
      },
      json: true,
      format: format.json(),
      replaceTimestamp: true,
      onConnectionError: (err) => {
        console.error('Loki connection error:', err);
      },
    }),
  );
}
