import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../server/app.module';

describe('BillingController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/billing/history (GET)', () => {
    return request(app.getHttpServer())
      .get('/billing/history')
      .expect(401); // Expect 401 as we're not passing a JWT
  });

  afterAll(async () => {
    await app.close();
  });
});
