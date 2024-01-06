import { Module } from '@nestjs/common';
import { EvController } from './ev.controller';

@Module({
  controllers: [EvController],
})
export class EvModule {}
