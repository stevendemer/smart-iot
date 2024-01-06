import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { DbService } from '../db/db.service';
import { EVDto } from './dto/ev.dto';

@Controller('ev')
export class EvController {
  private logger = new Logger(EvController.name);

  constructor(private readonly dbService: DbService) {}

  @Post('/readings')
  @HttpCode(HttpStatus.CREATED)
  async postEVInfo(@Body() body: EVDto) {
    try {
      const {
        carBatteryCapacity,
        currentChargeLevel,
        minChargeLevel,
        durationStay,
      } = body;

      return await this.dbService.eVReading.create({
        data: {
          carBatteryCapacity,
          minChargeLevel,
          durationStay,
          currentChargeLevel,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  @Get('/readings')
  async getAllReadings() {
    try {
      return await this.dbService.eVReading.findMany({});
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
