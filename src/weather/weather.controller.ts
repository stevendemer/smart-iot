import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import * as moment from 'moment';
import { DbService } from '../db/db.service';
import { ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/at.guard';

@UseGuards(AccessTokenGuard)
@ApiTags('Weather')
@Controller('weather')
export class WeatherController {
  constructor(private dbService: DbService) {}

  @Get('now')
  async getCurrentForecast() {
    const date = moment().add(2, 'hours').format('YYYY-MM-DD HH:00:00');

    const now = moment(date).toISOString();

    return await this.dbService.weatherForecast.findFirst({
      where: {
        forecastDate: now,
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

  @Get('')
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

  // Get the forecast for the whole date
  // ex. /weather/2023-01-09
  @Get('/:date')
  async getForecastDate(@Param('date') date: string) {
    const parsedDate = new Date(date);

    // check if the date string is valid
    if (isNaN(parsedDate.getTime())) {
      throw new NotFoundException('Invalid date format');
    }

    const forecast = await this.dbService.weatherForecast.findMany({
      where: {
        forecastDate: {
          contains: parsedDate.toISOString(),
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
      throw new NotFoundException('No forecast found for the date given');
    }

    return forecast;
  }

  @Get('/today/radiation')
  async getTodayRadiation() {
    const date = moment().add(2, 'hours').format('YYYY-MM-DD HH:00:00');
    const now = moment(date).toISOString();

    const forecasts = await this.dbService.weatherForecast.findMany({
      where: {
        forecastDate: {
          contains: now,
        },
      },
      select: {
        diffuseRadiation: true,
        directRadiation: true,
      },
    });

    // sum all the radiation values for today
    const totalRadiation = forecasts.reduce((sum, forecast) => {
      return (sum = forecast.diffuseRadiation + forecast.directRadiation);
    }, 0);

    return {
      now,
      totalRadiation,
    };
  }
}
