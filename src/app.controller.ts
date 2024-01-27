import { Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { DbService } from './db/db.service';
import { WeatherService } from './weather/weather.service';
import { AmpecoService } from './ampeco/ampeco.service';
import { HuaweiService } from './huawei/huawei.service';

@Controller()
export class AppController {
  constructor() {}

  @Get('hello')
  async getHello(): Promise<any> {
    return {
      message: 'Hello world',
    };

    // await this.pricesService.storeJSONPrices();
    // await this.weatherService.getForecast();
    // const prices = await this.dbService.energyPrice.findMany({});
    // return {
    //   prices,
    // };
  }
}
