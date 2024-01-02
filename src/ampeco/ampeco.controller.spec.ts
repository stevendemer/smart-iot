import { Test, TestingModule } from '@nestjs/testing';
import { AmpecoController } from './ampeco.controller';

describe('AmpecoController', () => {
  let controller: AmpecoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AmpecoController],
    }).compile();

    controller = module.get<AmpecoController>(AmpecoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
