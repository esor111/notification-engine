import { Counter, Histogram, Gauge, Registry, register } from 'prom-client';

export const metricsRegistry = register;

// HTTP metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [metricsRegistry],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
});

// Database metrics
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [metricsRegistry],
});

export const dbConnectionPoolSize = new Gauge({
  name: 'db_connection_pool_size',
  help: 'Current database connection pool size',
  registers: [metricsRegistry],
});

// RabbitMQ metrics
export const mqMessagePublished = new Counter({
  name: 'mq_messages_published_total',
  help: 'Total number of messages published to RabbitMQ',
  labelNames: ['queue', 'event_type'],
  registers: [metricsRegistry],
});

export const mqMessageConsumed = new Counter({
  name: 'mq_messages_consumed_total',
  help: 'Total number of messages consumed from RabbitMQ',
  labelNames: ['queue', 'status'],
  registers: [metricsRegistry],
});

export const mqMessageProcessingDuration = new Histogram({
  name: 'mq_message_processing_duration_seconds',
  help: 'Duration of message processing in seconds',
  labelNames: ['queue', 'consumer'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [metricsRegistry],
});

// Notification metrics
export const notificationCreated = new Counter({
  name: 'notifications_created_total',
  help: 'Total number of notifications created',
  labelNames: ['event_type', 'priority'],
  registers: [metricsRegistry],
});

export const notificationDispatched = new Counter({
  name: 'notifications_dispatched_total',
  help: 'Total number of notifications dispatched',
  labelNames: ['channel', 'status'],
  registers: [metricsRegistry],
});

export const notificationDeliveryDuration = new Histogram({
  name: 'notification_delivery_duration_seconds',
  help: 'Duration from notification creation to delivery',
  labelNames: ['channel', 'provider'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [metricsRegistry],
});

// Outbox metrics
export const outboxEventsPending = new Gauge({
  name: 'outbox_events_pending',
  help: 'Number of pending outbox events',
  registers: [metricsRegistry],
});

export const outboxEventsProcessed = new Counter({
  name: 'outbox_events_processed_total',
  help: 'Total number of outbox events processed',
  labelNames: ['status'],
  registers: [metricsRegistry],
});

// Auth metrics
export const authAttempts = new Counter({
  name: 'auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['type', 'status'],
  registers: [metricsRegistry],
});

export function registerMetrics(): void {
  // Metrics are registered on creation above
  console.log('Application metrics registered');
}
