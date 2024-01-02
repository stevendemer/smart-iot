import { Test, TestingModule } from '@nestjs/testing';
import { AmpecoService } from './ampeco.service';

describe('AmpecoService', () => {
  let service: AmpecoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AmpecoService],
    }).compile();

    service = module.get<AmpecoService>(AmpecoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
