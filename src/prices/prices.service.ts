import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { parseString } from 'xml2js';
import { DbService } from '../db/db.service';
import * as moment from 'moment';
import { firstValueFrom } from 'rxjs';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PricesService implements OnModuleInit {
  private logger = new Logger(PricesService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly dbService: DbService,
  ) {}

  async onModuleInit() {
    await this.dbService.energyPrice.deleteMany({});
    await this.storePrices();
  }

  getDates() {
    const startOfDay = moment().startOf('day');

    // format the days in order to pass them as parameters
    const periodStart = startOfDay.format('YYYYMMDDHHmm');
    const periodEnd = startOfDay.add(1, 'day').format('YYYYMMDDHHmm');

    return {
      periodEnd,
      periodStart,
    };
  }

  /**
   *
   * @returns the URL needed to fetch the day ahead prices (euro / mwh)
   */
  generateURL() {
    const timeInterval = this.getTimeInterval();

    return `https://web-api.tp.entsoe.eu/api?documentType=A44&out_Domain=10YGR-HTSO-----Y&in_Domain=10YGR-HTSO-----Y&timeInterval=${timeInterval}&securityToken=${process.env.ENTSOE_API_TOKEN}`;
  }

  formatHour(hourString: string) {
    return (hourString.length === 1 ? '0' : '') + hourString;
  }

  /**
   * Day-head prices
   */
  async getEnergyPrices() {
    const url = this.generateURL();

    const { data, status } = await firstValueFrom(this.httpService.get(url));

    if (status === 401) {
      throw new UnauthorizedException('Missing or invalid ENTSOE token');
    }
    if (status === 400) {
      throw new BadRequestException('Invalid query attributes or parameters');
    }
    if (status === 409) {
      throw new InternalServerErrorException(
        'Too many requests - max allowed 400 per minute',
      );
    }

    return {
      prices: data,
    };
  }

  convertPositionToHour(position: any) {
    const hour = parseInt(position[0]);
    return hour < 10 ? `0${hour}:00` : `${hour}:00`;
  }

  /**
   * Gets the XML response, parses it and stores it in the database
   */
  @Cron(CronExpression.EVERY_DAY_AT_10PM, { name: 'prices' })
  async storePrices() {
    const { prices } = await this.getEnergyPrices();

    parseString(prices, async (error, result: any) => {
      if (error) {
        this.logger.error(
          `Parsing XML error: ${error.message} - stack: ${error.stack}`,
        );
        throw new InternalServerErrorException(
          'Error parsing XML data from ENTSOE',
        );
      }

      const { periodEnd, periodStart } = this.getDates();

      const timeSeriesArray = result.Publication_MarketDocument.TimeSeries;

      const todayPrices = timeSeriesArray[0]?.Period?.[0]?.Point || [];

      const nextDayPrices = timeSeriesArray[1]?.Period?.[0]?.Point || [];

      const promises: Promise<any>[] = [];

      todayPrices.map(async (item) => {
        let hour = this.convertPositionToHour(item.position);
        const price = parseFloat(item['price.amount'][0]);
        let formatDate = moment(periodStart, 'YYYYMMDDHHmm');

        const pro1 = this.dbService.energyPrice.create({
          data: {
            date: formatDate.format('YYYY-MM-DD'),
            hour,
            price,
          },
        });
        promises.push(pro1);
      });

      nextDayPrices.map(async (item) => {
        const hour = this.convertPositionToHour(item.position);
        const price = parseFloat(item['price.amount'][0]);

        const formatDate = moment(periodEnd, 'YYYYMMDDHHmm').format(
          'YYYY-MM-DD',
        );

        const pro2 = this.dbService.energyPrice.create({
          data: {
            date: formatDate,
            hour,
            price,
          },
        });

        promises.push(pro2);
      });

      await Promise.all(promises).catch((error) => {
        this.logger.error(error);
        throw error;
      });
    });
  }

  async findCurrentHourPrice() {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const hour = now.getHours().toString().padStart(2, '0') + ':00';

    try {
      return await this.dbService.energyPrice.findFirst({
        where: {
          date,
          hour,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async findPricesForToday() {
    const now = new Date();
    const date = now.toISOString().split('T')[0];

    try {
      return await this.dbService.energyPrice.findMany({
        where: {
          date,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async findHighestPrice(date?: string) {
    try {
      if (date) {
        // the highest only for today

        return await this.dbService.energyPrice.findFirst({
          where: {
            date,
          },
          select: {
            price: true,
          },
          orderBy: {
            price: 'desc',
          },
        });
      }

      return await this.dbService.energyPrice.findFirst({
        select: {
          price: true,
        },
        orderBy: {
          price: 'desc', // asc for the lowest
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getAllPrices() {
    return await this.dbService.energyPrice.findMany({});
  }

  async findLowestPrice(date?: string) {
    try {
      if (date) {
        return await this.dbService.energyPrice.findFirst({
          where: {
            date,
          },
          select: {
            price: true,
          },
          orderBy: {
            price: 'asc',
          },
        });
      }

      return await this.dbService.energyPrice.findFirst({
        select: {
          price: true,
        },
        orderBy: {
          price: 'asc',
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  getTimeInterval(startDate?: string, endDate?: string) {
    const current = new Date();

    const sd = startDate
      ? new Date(new Date(startDate).setMinutes(0, 0, 0))
      : new Date(new Date(current).setMinutes(0, 0, 0));
    const ed = endDate
      ? new Date(new Date(endDate).setMinutes(0, 0, 0))
      : new Date(new Date(sd).setHours(sd.getHours() + 24));

    const timeInterval = `${sd.toISOString()}/${ed.toISOString()}`;
    return timeInterval;
  }
}
