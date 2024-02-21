import {
  Controller,
  Get,
  NotFoundException,
  OnModuleInit,
  Param,
  UseGuards,
} from '@nestjs/common';
import * as moment from 'moment';
import { DbService } from '../db/db.service';
import { ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/at.guard';

@ApiTags('Weather')
@Controller('weather')
export class WeatherController {
  constructor(private dbService: DbService) {}

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

  @Get('/total-radiation/today')
  async getTotalRadiationToday() {
    const date = moment().format('YYYY-MM-DD');

    const forecasts = await this.dbService.weatherForecast.findMany({
      where: {
        forecastDate: {
          contains: date,
        },
      },
      select: {
        diffuseRadiation: true,
        directRadiation: true,
      },
    });
    let sum = 0;

    for (let f of forecasts) {
      sum += f.diffuseRadiation + f.directRadiation;
    }

    return {
      date,
      totalRadiation: sum,
    };
  }

  @Get('/total-radiation')
  async getTotalRadiation() {
    const forecasts = await this.dbService.weatherForecast.findMany({
      select: {
        diffuseRadiation: true,
        directRadiation: true,
      },
    });
    let sum = 0;

    for (let f of forecasts) {
      sum += f.diffuseRadiation + f.directRadiation;
    }

    return {
      totalRadiation: sum,
    };
  }

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
          contains: date,
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
}
