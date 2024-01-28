import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DbService } from '../db/db.service';
import { EVDto } from './dto/ev.dto';
import { AmpecoService } from '../ampeco/ampeco.service';
import { ChargeSessionEvent } from '../notifications/charge-session.event';
import { AccessTokenGuard } from '../auth/guards/at.guard';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * TODO: When a user posts from the form, check if the charger is working, else start the polling
 *
 */

@UseGuards(AccessTokenGuard)
@Controller('ev')
export class EvController {
  private logger = new Logger(EvController.name);
  private chargePointId = 63205; // RENEL-IKE Thess
  private evseNetworkId = 1;

  constructor(
    private readonly dbService: DbService,
    private readonly ampecoService: AmpecoService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Retrieve the user input from the MMS form
   * @param body
   */
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

      const isCharging = await this.ampecoService.isCurrentlyCharging(
        this.chargePointId,
      );

      if (isCharging) {
        return {
          message:
            'The charge station: ' + this.chargePointId + ' is unavailable',
        };
      }

      // trigger the cron job for storing the session info
      this.eventEmitter.emit('charging.started', new ChargeSessionEvent(true));

      return {
        message: 'You can charge your vehicle !',
      };
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
