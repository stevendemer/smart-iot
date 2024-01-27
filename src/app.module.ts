import { ChargeListener } from './events/charge.listener';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PricesModule } from './prices/prices.module';
import { ConfigModule } from '@nestjs/config';
import { WeatherModule } from './weather/weather.module';
import { AmpecoModule } from './ampeco/ampeco.module';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { HuaweiModule } from './huawei/huawei.module';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { EvModule } from './ev/ev.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({
      delimiter: '.',
    }),
    PricesModule,
    // reading env variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    WeatherModule,
    AmpecoModule,
    HuaweiModule,
    AuthModule,
    EvModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    ChargeListener,
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
