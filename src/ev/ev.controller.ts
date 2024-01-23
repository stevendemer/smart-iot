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
import { AmpecoService } from '../ampeco/ampeco.service';
import { ChargeSessionEvent } from '../events/charge-session.event';

@Controller('ev')
export class EvController {
  private logger = new Logger(EvController.name);
  private chargePointId = 63205; // RENEL-IKE Thess
  private evseNetworkId = 1;

  constructor(
    private readonly dbService: DbService,
    private readonly ampecoService: AmpecoService,
  ) {}

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

      await this.dbService.eVReading.create({
        data: {
          carBatteryCapacity,
          minChargeLevel,
          durationStay,
          currentChargeLevel,
        },
      });

      const chargingStatus = await this.ampecoService.isCurrentlyCharging(
        this.chargePointId,
      );

      const sessionEvent = new ChargeSessionEvent();
      sessionEvent.isCharging = chargingStatus;
      // sessionEvent.sessionId =

      // check if the charging has started, and store the session info

      // start the charging session
      // return await this.ampecoService.startChargingSession(
      //   this.chargePointId,
      //   this.evseNetworkId,
      // );
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

  @Get('/readings/stay/max')
  async getMaxStay() {
    try {
      return await this.dbService.eVReading.findFirst({
        orderBy: {
          durationStay: 'desc',
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  @Get('/readings/stay/min')
  async getMinStay() {
    try {
      return await this.dbService.eVReading.findFirst({
        orderBy: {
          durationStay: 'asc',
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  @Get('/readings/latest')
  async getLastReading() {
    try {
      return await this.dbService.eVReading.findFirst({
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  @Get('/readings/capacity/max')
  async getMaxBatteryCapacity() {
    try {
      return await this.dbService.eVReading.findFirst({
        orderBy: {
          carBatteryCapacity: 'desc',
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  @Get('/readings/capacity/min')
  async getMinBatteryCapacity() {
    try {
      return await this.dbService.eVReading.findFirst({
        orderBy: {
          carBatteryCapacity: 'asc',
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
