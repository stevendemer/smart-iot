import {
  Controller,
  Get,
  HttpCode,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { HuaweiService } from './huawei.service';
import { ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/at.guard';

@UseGuards(AccessTokenGuard)
@Controller('huawei')
@ApiTags('Huawei')
export class HuaweiController {
  constructor(private readonly huaweiService: HuaweiService) {}

  @Get()
  async getAllReadings() {
    return await this.huaweiService.getAll();
  }

  @Get('/device/:id')
  async getDevReadings(@Param('id') id: number) {
    return await this.huaweiService.getDeviceReadings(id);
  }

  @Get('/:date')
  async getReadingByDate(@Param('date') date: string) {
    return await this.huaweiService.getReadingByDate(date);
  }
}
