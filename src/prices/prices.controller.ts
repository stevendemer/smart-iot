import { Controller, Get } from '@nestjs/common';
import { PricesService } from './prices.service';
import { ApiTags } from '@nestjs/swagger';
import * as moment from 'moment';

@ApiTags('prices')
@Controller('prices')
export class PricesController {
  constructor(private pricesService: PricesService) {}

  @Get('/now')
  async getPrice() {
    return await this.pricesService.findCurrentHourPrice();
  }

  @Get('/today')
  async getPricesForToday() {
    return await this.pricesService.findPricesForToday();
  }

  @Get('/max')
  async getHighestPrice() {
    return await this.pricesService.findHighestPrice();
  }

  @Get('/all')
  async getAllPrices() {
    return await this.pricesService.getAllPrices();
  }

  @Get('/min')
  async getLowestPrice() {
    return await this.pricesService.findLowestPrice();
  }

  @Get('/max-today')
  async getHighestToday() {
    const today = moment().format('YYYY-MM-DD');

    return await this.pricesService.findHighestPrice(today);
  }

  @Get('/min-today')
  async getLowestToday() {
    const today = moment().format('YYYY-MM-DD');

    return await this.pricesService.findLowestPrice(today);
  }
}
