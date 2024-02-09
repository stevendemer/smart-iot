import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PricesService } from './prices.service';
import { ApiTags } from '@nestjs/swagger';
import * as moment from 'moment';
import { AccessTokenGuard } from '../auth/guards/at.guard';

@UseGuards(AccessTokenGuard)
@ApiTags('Energy Prices')
@Controller('prices')
export class PricesController {
  constructor(private pricesService: PricesService) {}

  @Get('/now')
  async getPrice() {
    // await this.pricesService.storePrices();
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

  @Get('/avg/:date')
  async getAvgPrice(@Param('date') date: string) {
    return await this.pricesService.findAvgPrice(date);
  }

  @Get('')
  async getAllPrices() {
    return await this.pricesService.getAllPrices();
  }

  @Get('/min')
  async getLowestPrice() {
    return await this.pricesService.findLowestPrice();
  }

  @Get('/today/max')
  async getHighestToday() {
    const today = moment().format('YYYY-MM-DD');

    return await this.pricesService.findHighestPrice(today);
  }

  @Get('/today/min')
  async getLowestToday() {
    const today = moment().format('YYYY-MM-DD');

    return await this.pricesService.findLowestPrice(today);
  }

  @Get('/:date')
  async getPricesDate(@Param('date') date: string) {
    const prices = await this.pricesService.findPriceForDate(date);
    return prices;
  }
}
