import { Controller, Get } from '@nestjs/common';
import { WeatherService } from './weather.service';
import * as moment from 'moment';
import { DbService } from '../db/db.service';

@Controller('weather')
export class WeatherController {
  constructor(
    private dbService: DbService,
    private weatherService: WeatherService,
  ) {
    this.weatherService
      .getDailyForecast()
      .finally(() => console.log('Inserted rows'));
  }

  @Get('now')
  async getForecast() {
    console.log(moment().add(2, 'hours').toISOString());

    const date = moment().add(2, 'hours').format('YYYY-MM-DD HH:00:00');

    const now = moment(date).toISOString();

    return await this.dbService.weatherForecast.findFirst({
      where: {
        forecastDate: {
          equals: now,
        },
      },
    });
  }
}
