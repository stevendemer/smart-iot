import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HuaweiService } from './huawei.service';
import { HttpModule } from '@nestjs/axios';
import { HuaweiController } from './huawei.controller';
import { TokenMiddleware } from './token.middleware';
import { ConfigModule } from '@nestjs/config';
import { TokenService } from './token.service';

@Module({
  providers: [HuaweiService, TokenService],
  imports: [
    ConfigModule,
    HttpModule.register({
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
