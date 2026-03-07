import { Body, Controller, Get, Post } from '@nestjs/common';
import { INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

class FakeUsersService {
  async list() {
    return [
      {
        id: 'a53b14c8-a42b-4d73-b3ce-45431b4704c6',
        email: 'john@example.com',
        fullName: 'John Doe',
        createdAt: '2026-03-06T00:00:00.000Z',
        updatedAt: '2026-03-06T00:00:00.000Z',
      },
    ];
  }

  async create(dto: { email: string; fullName: string }) {
    return {
      id: 'a53b14c8-a42b-4d73-b3ce-45431b4704c6',
      email: dto.email,
      fullName: dto.fullName,
      createdAt: '2026-03-06T00:00:00.000Z',
      updatedAt: '2026-03-06T00:00:00.000Z',
    };
  }
}

@Controller('users')
class TestUsersController {
  constructor(private readonly usersService: FakeUsersService) {}

  @Get()
  list() {
    return this.usersService.list();
  }

  @Post()
  create(@Body() dto: { email: string; fullName: string }) {
    return this.usersService.create(dto);
  }
}

@Module({
  controllers: [TestUsersController],
  providers: [FakeUsersService],
})
class TestUsersModule {}

describe('Users (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestUsersModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/users').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].email).toBe('john@example.com');
  });

  it('/users (POST)', async () => {
    const payload = { email: 'alice@example.com', fullName: 'Alice Doe' };
    const res = await request(app.getHttpServer()).post('/users').send(payload).expect(201);

    expect(res.body.email).toBe(payload.email);
    expect(res.body.fullName).toBe(payload.fullName);
  });
});
