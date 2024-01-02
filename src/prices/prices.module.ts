import { Module } from '@nestjs/common';
import { PricesService } from './prices.service';
import { HttpModule } from '@nestjs/axios';
import { DbModule } from 'src/db/db.module';
import { DbService } from 'src/db/db.service';
import { PricesController } from './prices.controller';

@Module({
  providers: [PricesService, DbService],
  imports: [
    DbModule,
    HttpModule.register({
      timeout: 8000,
      maxRedirects: 5,
    }),
  ],
  controllers: [PricesController],
  exports: [PricesService],
})
export class PricesModule {}
