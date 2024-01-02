import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HuaweiService } from './huawei.service';
import { HttpModule } from '@nestjs/axios';
import { HuaweiController } from './huawei.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TokenInterceptor } from './token.interceptor';
import { TokenMiddleware } from './token.middleware';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [
    HuaweiService,
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: TokenInterceptor,
    // },
  ],
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 8000,
      maxRedirects: 5,
      baseURL: process.env.HUAWEI_BASE_URL,
    }),
  ],
  controllers: [HuaweiController],
  exports: [HuaweiService],
})
export class HuaweiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenMiddleware).forRoutes('huawei');
  }
}
