import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { validateEnv } from './common/config/configuration';
import { getTypeOrmConfig } from './common/db/orm.config';
import { ReadinessService } from './common/health/readiness.service';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { MqModule } from './common/mq/mq.module';
import { HealthController } from './modules/health/controller/health.controller';
import { HealthService } from './modules/health/service/health.service';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv }),
    TypeOrmModule.forRoot(getTypeOrmConfig()),
    MqModule,
    AuthModule,
    NotificationsModule,
    UsersModule,
  ],
  controllers: [HealthController],
  providers: [HealthService, ReadinessService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
