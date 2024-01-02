import { Module } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { DbService } from 'src/db/db.service';
import { WeatherController } from './weather.controller';

@Module({
  providers: [WeatherService, DbService],
  exports: [WeatherService],
  controllers: [WeatherController],
})
export class WeatherModule {}
