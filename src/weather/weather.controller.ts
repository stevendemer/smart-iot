import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import * as moment from 'moment';
import { DbService } from '../db/db.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('weather')
@Controller('weather')
export class WeatherController {
  constructor(private dbService: DbService) {}

  @Get('now')
  async getForecast() {
    const date = moment().add(2, 'hours').format('YYYY-MM-DD HH:00:00');

    const now = moment(date).toISOString();

    return await this.dbService.weatherForecast.findFirst({
      where: {
        forecastDate: {
          equals: now,
        },
      },
      select: {
        cloudCover: true,
        diffuseRadiation: true,
        isDay: true,
        directRadiation: true,
        temperature: true,
        forecastDate: true,
      },
    });
  }

  // Get the forecast for the whole date
  // ex. /weather/forecast/2023-01-09
  @Get('/forecast/:date')
  async getForecastByDay(@Param('date') date: string) {
    const day = new Date(date).toISOString();

    const forecast = await this.dbService.weatherForecast.findMany({
      where: {
        forecastDate: {
          contains: day,
        },
      },
      select: {
        cloudCover: true,
        diffuseRadiation: true,
        isDay: true,
        directRadiation: true,
        temperature: true,
        forecastDate: true,
      },
    });

    if (!forecast || forecast.length === 0) {
      throw new NotFoundException('No forecast found for the specified date');
    }

    return forecast;
  }

  @Get('/all')
  async getAllForecasts() {
    return await this.dbService.weatherForecast.findMany({
      select: {
        cloudCover: true,
        diffuseRadiation: true,
        isDay: true,
        directRadiation: true,
        temperature: true,
        forecastDate: true,
      },
    });
  }
}
