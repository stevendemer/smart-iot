import { Test, TestingModule } from '@nestjs/testing';
import { AmpecoService } from './ampeco.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ApiResponse } from './dto/response.dto';
import * as faker from '@faker-js/faker';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DbService } from 'src/db/db.service';

describe('Ampeco Service', () => {
  let service: AmpecoService;
  let httpService: HttpService;
  let configService: ConfigService;
  let dbService: DbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        AmpecoService,
        HttpService,
        InternalServerErrorException,
        ConfigService,
        DbService,
      ],
    }).compile();

    service = module.get<AmpecoService>(AmpecoService);
    httpService = module.get<HttpService>(HttpService);
    dbService = module.get<DbService>(DbService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fetch session and create session in the db', async () => {
    const mockResponse: ApiResponse = {
      userId: faker.faker.string.uuid(),
      id: faker.faker.string.uuid(),
      amount: faker.faker.number.int(),
      socPercent: faker.faker.number.int(),
      energy: faker.faker.number.int(),
      chargePointId: faker.faker.string.uuid(),
      powerKw: faker.faker.number.int(),
      status: faker.faker.helpers.arrayElement([
        'pending',
        'completed',
        'error',
      ]),
      startedAt: faker.faker.date.recent().toISOString(),
      stoppedAt: faker.faker.date.recent().toISOString(),
      evseId: faker.faker.string.uuid(),
      electricityCost: faker.faker.number.int(),
    };
  });
});
