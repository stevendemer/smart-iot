import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DbService } from '../db/db.service';
import { JwtService, JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { randEmail, randPassword, randText } from '@ngneat/falso';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let dbService: DbService;
  let configService: ConfigService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService, DbService, JwtService, ConfigService],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    dbService = module.get<DbService>(DbService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Register new account', () => {
    it('Should create new account and return the tokens', async () => {
      const mockData = {
        email: 'peter@gmail.com',
        password: 'helloworld',
      };

      const result = await controller.signUp(mockData);

      expect(result).toBeDefined();
      expect(result).toBeTruthy();
    });
  });
});
