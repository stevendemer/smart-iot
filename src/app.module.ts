import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { PricesModule } from './prices/prices.module';
import { HttpModule } from '@nestjs/axios';
import { PricesService } from './prices/prices.service';
import { ConfigModule } from '@nestjs/config';
import { DbService } from './db/db.service';
import { WeatherModule } from './weather/weather.module';
import { WeatherService } from './weather/weather.service';
import { AmpecoModule } from './ampeco/ampeco.module';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { HuaweiModule } from './huawei/huawei.module';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { AuthModule } from './auth/auth.module';
import { TokenMiddleware } from './huawei/token.middleware';
import { CacheModule } from '@nestjs/cache-manager';
import { EvModule } from './ev/ev.module';

@Module({
  imports: [
    DbModule,
    PricesModule,
    HttpModule,
    // reading env variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    WeatherModule,
    AmpecoModule,
    HuaweiModule,
    AuthModule,
    EvModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // applys logging for all routes
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
