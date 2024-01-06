import { CacheInterceptor } from '@nestjs/cache-manager';
import {
  Controller,
  Get,
  NotFoundException,
  UseInterceptors,
} from '@nestjs/common';
import { PricesService } from './prices.service';
import { ApiTags } from '@nestjs/swagger';

// @UseInterceptors(CacheInterceptor)
@ApiTags('prices')
@Controller('prices')
export class PricesController {
  constructor(private pricesService: PricesService) {}

  @Get('/now')
  async getPrice() {
    const price = await this.pricesService.findCurrentHourPrice();
    return price;
  }

  @Get('/store')
  async getPrices() {
    return await this.pricesService.storePrices();
  }
}
