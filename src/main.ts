import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { appConfig } from './common/config/configuration';
import { ProblemDetailsFilter } from './common/errors/problem-details.filter';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(new Logger());
  app.useGlobalInterceptors(new RequestLoggingInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new ProblemDetailsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Backend API')
    .setDescription('Agent-friendly backend API')
    .setVersion('0.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey}_${methodKey}`,
  });
  SwaggerModule.setup('docs', app, document);

  const port = appConfig.port;
  await app.listen(port);
  Logger.log(`Service listening on port ${port}`, 'Bootstrap');
}

void bootstrap();
