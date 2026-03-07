type NodeEnv = 'development' | 'test' | 'production';

type ValidatedEnv = Record<string, string | undefined>;

export type AppConfig = {
  nodeEnv: NodeEnv;
  port: number;
  serviceName: string;
  db: {
    host: string;
    port: number;
    database: string;
    schema?: string;
    username: string;
    password: string;
    synchronize: false;
    logging: boolean;
  };
  mq: {
    url: string;
    queue: string;
    userCreatedQueue: string;
    notificationEventsQueue: string;
    prefetchCount: number;
    outboxBatchSize: number;
    outboxPollIntervalMs: number;
  };
  auth: {
    accessTokenSecret: string;
    refreshTokenSecret: string;
    accessTokenExpiresInSeconds: number;
    refreshTokenExpiresInDays: number;
    passwordPepper: string;
  };
  notifications: {
    maxDeliveryRetries: number;
  };
};

function readNumber(env: ValidatedEnv, key: string, fallback: number, minimum = 1): number {
  const raw = env[key];
  if (raw === undefined || raw === '') {
    return fallback;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value < minimum) {
    throw new Error(`Environment variable ${key} must be a number >= ${minimum}`);
  }

  return value;
}

function readString(env: ValidatedEnv, key: string, fallback?: string): string {
  const value = env[key] ?? fallback;
  if (!value) {
    throw new Error(`Environment variable ${key} is required`);
  }

  return value;
}

function readSecret(env: ValidatedEnv, key: string, fallback: string, nodeEnv: NodeEnv): string {
  const value = env[key];
  if (value && value.length > 0) {
    return value;
  }

  if (nodeEnv === 'production') {
    throw new Error(`Environment variable ${key} is required in production`);
  }

  return fallback;
}

export function loadAppConfig(env: ValidatedEnv = process.env): AppConfig {
  const rawNodeEnv = env.NODE_ENV ?? 'development';
  if (rawNodeEnv !== 'development' && rawNodeEnv !== 'test' && rawNodeEnv !== 'production') {
    throw new Error('Environment variable NODE_ENV must be development, test, or production');
  }

  return {
    nodeEnv: rawNodeEnv,
    port: readNumber(env, 'PORT', 3000),
    serviceName: readString(env, 'OTEL_SERVICE_NAME', 'backend-api'),
    db: {
      host: readString(env, 'DB_HOST', 'localhost'),
      port: readNumber(env, 'DB_PORT', 5432),
      database: readString(env, 'DB_NAME', 'backend'),
      schema: env.DB_SCHEMA || undefined,
      username: readString(env, 'DB_USER', 'backend'),
      password: readString(env, 'DB_PASSWORD', 'backend'),
      synchronize: false,
      logging: env.DB_LOGGING === 'true',
    },
    mq: {
      url: readString(env, 'RABBITMQ_URL', 'amqp://guest:guest@localhost:5672'),
      queue: readString(env, 'RABBITMQ_QUEUE', 'default'),
      userCreatedQueue: readString(env, 'USER_CREATED_QUEUE', 'user.created'),
      notificationEventsQueue: readString(env, 'NOTIFICATION_EVENTS_QUEUE', 'notification.events'),
      prefetchCount: readNumber(env, 'MQ_PREFETCH_COUNT', 10),
      outboxBatchSize: readNumber(env, 'OUTBOX_BATCH_SIZE', 20),
      outboxPollIntervalMs: readNumber(env, 'OUTBOX_POLL_INTERVAL_MS', 3000, 100),
    },
    auth: {
      accessTokenSecret: readSecret(
        env,
        'AUTH_ACCESS_TOKEN_SECRET',
        'dev-access-secret',
        rawNodeEnv,
      ),
      refreshTokenSecret: readSecret(
        env,
        'AUTH_REFRESH_TOKEN_SECRET',
        'dev-refresh-secret',
        rawNodeEnv,
      ),
      accessTokenExpiresInSeconds: readNumber(env, 'AUTH_ACCESS_TOKEN_TTL_SECONDS', 900),
      refreshTokenExpiresInDays: readNumber(env, 'AUTH_REFRESH_TOKEN_TTL_DAYS', 30),
      passwordPepper: env.AUTH_PASSWORD_PEPPER ?? '',
    },
    notifications: {
      maxDeliveryRetries: readNumber(env, 'NOTIFICATION_MAX_DELIVERY_RETRIES', 5),
    },
  };
}

export function validateEnv(env: ValidatedEnv): ValidatedEnv {
  loadAppConfig(env);
  return env;
}

export const appConfig = loadAppConfig();
