import { Module } from '@nestjs/common';
import { EvController } from './ev.controller';
import { AmpecoModule } from '../ampeco/ampeco.module';

@Module({
  imports: [AmpecoModule],
  controllers: [EvController],
})
export class EvModule {}
