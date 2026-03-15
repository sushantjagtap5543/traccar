import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../server/app.module';

describe('DevicesController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/devices (GET)', () => {
    return request(app.getHttpServer())
      .get('/devices')
      .expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
