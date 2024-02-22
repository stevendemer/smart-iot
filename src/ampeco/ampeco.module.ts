import { Module } from '@nestjs/common';
import { AmpecoService } from './ampeco.service';
import { HttpModule } from '@nestjs/axios';
import { AmpecoController } from './ampeco.controller';

@Module({
  providers: [AmpecoService],
  imports: [
    HttpModule.register({
      baseURL: process.env.AMPECO_BASE_URI,
      headers: {
        Authorization: `Bearer ${process.env.AMPECO_API_TOKEN}`,
      },
    }),
  ],
  exports: [AmpecoService],
  controllers: [AmpecoController],
})
export class AmpecoModule {}
