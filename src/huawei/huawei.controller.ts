import {
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { HuaweiService } from './huawei.service';
import {
  CACHE_MANAGER,
  CacheKey,
  CacheTTL,
  CacheInterceptor,
} from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('huawei')
@Controller('huawei')
export class HuaweiController {
  constructor(
    private readonly huaweiService: HuaweiService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private configService: ConfigService,
  ) {}

  @HttpCode(200)
  @Post('login')
  async login() {
    const response = await this.huaweiService.login();
    if (response.failCode === 0) {
      // login was a success

      return {
        token: response.token,
        message: 'Logged in',
      };
    }
  }

  @Get('/dev/real-time')
  async testRoute() {
    return await this.huaweiService.storeDevRealTime();
  }

  @Get('/stations')
  async getStations() {
    return await this.huaweiService.getStations();
  }

  @Get('/token')
  async getToken() {
    const cachedToken = await this.cacheManager.get('huawei-token');
    if (!cachedToken) {
      return {
        message: 'No token found',
      };
    }
    return cachedToken;
  }
}
