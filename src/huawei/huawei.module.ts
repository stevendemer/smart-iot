import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HuaweiService } from './huawei.service';
import { HttpModule } from '@nestjs/axios';
import { HuaweiController } from './huawei.controller';
import { TokenMiddleware } from './token.middleware';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from '../db/db.module';
import { TokenService } from './token.service';

@Module({
  providers: [HuaweiService, TokenService],
  imports: [
    DbModule,
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
