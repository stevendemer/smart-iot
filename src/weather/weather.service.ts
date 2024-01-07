import { Injectable } from '@nestjs/common';
import { fetchWeatherApi } from 'openmeteo';
import { DbService } from '../db/db.service';

/**
 * Fetches from openmeteo API the cloud cover, whether is day or not, the radiation values and current temperature.
 * Latitude, longitude is set for the Mediterranean Cosmos
 */

@Injectable()
export class WeatherService {
  constructor(private readonly dbService: DbService) {}

  async getDailyForecast() {
    const url = 'https://api.open-meteo.com/v1/forecast';

    // the default is a 7-day ahead forecast
    const params = {
      latitude: 40.55556,
      longitude: 22.993086,
      current: ['is_day'],
      // forecast_days: 1,
      hourly: [
        'temperature_2m',
        'cloud_cover',
        'is_day',
        'direct_radiation',
        'diffuse_radiation',
        'apparent_temperature',
      ],
      timezone: 'Africa/Cairo',
    };

    const responses = await fetchWeatherApi(url, params);

    // helper function to form time ranges
    const range = (start: number, stop: number, step: number) =>
      Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

    const response = responses[0];

    const utcOffsetSeconds = response.utcOffsetSeconds();
    const timezone = response.timezone();
    const latitude = response.latitude();
    const longitude = response.longitude();

    const current = response.current();
    const hourly = response.hourly();

    const weatherData = {
      current: {
        time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
        isDay: current.variables(0)!.value(),
      },
      hourly: {
        time: range(
          Number(hourly.time()),
          Number(hourly.timeEnd()),
          hourly.interval(),
        ).map((t) => new Date((t + utcOffsetSeconds) * 1000)),
        temperature2m: hourly.variables(0)!.valuesArray()!,
        cloudCover: hourly.variables(1)!.valuesArray()!,
        isDay: hourly.variables(2)!.valuesArray()!,
        directRadiation: hourly.variables(3)!.valuesArray()!,
        diffuseRadiation: hourly.variables(4)!.valuesArray()!,
        apparentTemperature: hourly.variables(5)!.valuesArray()!,
      },
    };

    console.log(JSON.stringify(weatherData, null, 2));

    for (let i = 0; i < weatherData.hourly.time.length; ++i) {
      await this.dbService.weatherForecast.create({
        data: {
          cloudCover: weatherData.hourly.cloudCover[i],
          temperature: weatherData.hourly.temperature2m[i],
          directRadiation: weatherData.hourly.directRadiation[i],
          diffuseRadiation: weatherData.hourly.diffuseRadiation[i],
          isDay: weatherData.hourly.isDay[i] === 1 ? true : false,
          forecastDate: weatherData.hourly.time[i].toISOString(),
        },
      });
    }
  }
}
