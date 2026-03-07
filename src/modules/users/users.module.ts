import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './controller/users.controller';
import { UserCreatedConsumer } from './consumer/user-created.consumer';
import { UserEntity } from './entity/user.entity';
import { UsersRepository } from './repository/users.repository';
import { UsersService } from './service/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, UserCreatedConsumer],
  exports: [UsersService],
})
export class UsersModule {}
