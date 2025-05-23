import { Module } from '@nestjs/common';
import { PricesService } from './prices.service';
import { HttpModule } from '@nestjs/axios';
import { DbModule } from '../db/db.module';
import { DbService } from '../db/db.service';
import { PricesController } from './prices.controller';

@Module({
  providers: [PricesService, DbService],
  imports: [
    DbModule,
    HttpModule.register({
      maxRedirects: 9,
    }),
  ],
  controllers: [PricesController],
  exports: [PricesService],
})
export class PricesModule {}
