import { Module } from '@nestjs/common';
import { EvController } from './ev.controller';
import { AmpecoModule } from '../ampeco/ampeco.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [AmpecoModule, HttpModule.register({})],
  controllers: [EvController],
})
export class EvModule {}
