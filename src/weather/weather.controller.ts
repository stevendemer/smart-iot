import { Controller, Get } from '@nestjs/common';
import { WeatherService } from './weather.service';
import * as moment from 'moment';
import { DbService } from '../db/db.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('weather')
@Controller('weather')
export class WeatherController {
  constructor(
    private dbService: DbService,
    private weatherService: WeatherService,
  ) {}

  @Get('now')
  async getForecast() {
    await this.weatherService.getDailyForecast();

    console.log(moment().add(2, 'hours').toISOString());

    // the default timezone is UTC (2 hours back)
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
