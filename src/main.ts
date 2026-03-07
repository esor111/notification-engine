import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.factory';
import { appConfig } from './common/config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  configureApp(app);

  const port = appConfig.port;
  await app.listen(port);
  Logger.log(`Service listening on port ${port}`, 'Bootstrap');
}

void bootstrap();
