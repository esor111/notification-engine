import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserDto } from '../dto/user.dto';
import { UsersService } from '../service/users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOkResponse({ type: UserDto, isArray: true })
  async listUsers(): Promise<UserDto[]> {
    return this.usersService.list();
  }

  @Post()
  @ApiCreatedResponse({ type: UserDto })
  @ApiConflictResponse({ description: 'Email already exists' })
  async createUser(@Body() dto: CreateUserDto): Promise<UserDto> {
    return this.usersService.create(dto);
  }
}
