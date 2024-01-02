import { CacheInterceptor } from '@nestjs/cache-manager';
import { Controller, UseInterceptors } from '@nestjs/common';

@UseInterceptors(CacheInterceptor)
@Controller('weather')
export class WeatherController {}
