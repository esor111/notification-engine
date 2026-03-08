import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.factory';
import { appConfig } from './common/config/configuration';
import { startTracing, stopTracing } from './common/observability/tracing';
import { registerMetrics } from './common/observability/metrics';

// Initialize observability before app creation
startTracing();
registerMetrics();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  configureApp(app);

  const port = appConfig.port;
  await app.listen(port);
  Logger.log(`Service listening on port ${port}`, 'Bootstrap');
  Logger.log(`Metrics available at http://localhost:9464/metrics`, 'Bootstrap');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    Logger.log('SIGTERM received, shutting down gracefully', 'Bootstrap');
    await stopTracing();
    await app.close();
  });
}

void bootstrap();
