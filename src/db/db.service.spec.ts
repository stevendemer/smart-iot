import { TestingModule, Test } from '@nestjs/testing';
import { DbService } from './db.service';
import { randEmail, randNumber, randText } from '@ngneat/falso';

describe('Database service', () => {
  let dbService: DbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DbService],
    }).compile();

    dbService = module.get<DbService>(DbService);
  });

  it('Should be defined', () => {
    expect(dbService).toBeDefined();
  });

  it('Should create user accounts and mock energy prices', async () => {
    const mockAccount = await dbService.user.create({
      data: {
        email: randEmail(),
        hash: randText(),
      },
    });

    const mockPrice = await dbService.energyPrice.create({
      data: {
        hour: randText(),
        price: randNumber({ min: 0, max: 100 }),
        date: randText(),
      },
    });

    expect(mockAccount).toBeDefined();
    expect(mockPrice).toBeDefined();

    expect(mockAccount).toBeTruthy();
    expect(mockPrice).toBeTruthy();
  });

  afterAll(async () => {
    await dbService.user.deleteMany({});
    await dbService.energyPrice.deleteMany({});
  });
});
