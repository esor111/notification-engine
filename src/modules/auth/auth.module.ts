import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { appConfig } from '../../common/config/configuration';
import { UserEntity } from '../users/entity/user.entity';
import { UsersRepository } from '../users/repository/users.repository';
import { AuthController } from './controller/auth.controller';
import { LocalCredentialEntity } from './entity/local-credential.entity';
import { RefreshSessionEntity } from './entity/refresh-session.entity';
import { LocalCredentialsRepository } from './repository/local-credentials.repository';
import { RefreshSessionsRepository } from './repository/refresh-sessions.repository';
import { AuthService } from './service/auth.service';
import { PasswordService } from './service/password.service';
import { TokenService } from './service/token.service';

@Module({
  imports: [
    JwtModule.register({
      secret: appConfig.auth.accessTokenSecret,
    }),
    TypeOrmModule.forFeature([UserEntity, LocalCredentialEntity, RefreshSessionEntity]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    UsersRepository,
    LocalCredentialsRepository,
    RefreshSessionsRepository,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
