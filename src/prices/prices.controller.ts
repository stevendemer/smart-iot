import { CacheInterceptor } from '@nestjs/cache-manager';
import { Controller, UseInterceptors } from '@nestjs/common';

@UseInterceptors(CacheInterceptor)
@Controller('prices')
export class PricesController {}
