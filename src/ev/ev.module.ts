import { Module } from '@nestjs/common';
import { EvController } from './ev.controller';
import { EvService } from './ev.service';

@Module({
  controllers: [EvController],
  providers: [EvService],
  exports: [EvService],
})
export class EvModule {}
