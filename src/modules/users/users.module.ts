import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersController } from './controller/users.controller';
import { UserCreatedConsumer } from './consumer/user-created.consumer';
import { UserEntity } from './entity/user.entity';
import { UsersRepository } from './repository/users.repository';
import { UsersService } from './service/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), NotificationsModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, UserCreatedConsumer, AuditService],
  exports: [UsersService],
})
export class UsersModule {}
