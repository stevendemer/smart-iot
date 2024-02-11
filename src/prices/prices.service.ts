import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { parseString, parseStringPromise } from 'xml2js';
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
   * @returns the URL needed to fetch the day ahead prices (euro / kwh)
   */
  generateURL() {
    const timeInterval = this.getTimeInterval();

    return `https://web-api.tp.entsoe.eu/api?documentType=A44&out_Domain=10YGR-HTSO-----Y&in_Domain=10YGR-HTSO-----Y&timeInterval=${timeInterval}&securityToken=${process.env.ENTSOE_API_TOKEN}`;
  }

  formatHour(hourString: string) {
    return (hourString.length === 1 ? '0' : '') + hourString;
  }

  async getEnergyPrices() {
    const url = this.generateURL();
    let error = new Error();

    try {
      const { data, status } = await firstValueFrom(this.httpService.get(url));

      if (status === 200) {
        return {
          document: data,
        };
      }

      if (status === 401) {
        error.message = await this.unauthorizedTR(data);
      }
      if (status === 400) {
        const json = await this.badRequestTR(data);
        error.message = json.message + ' - ' + json.code;
      }
      if (status === 409) {
        error.message =
          'Too many requests - max allowed 400 per minute from each unique IP';
      }

      throw error;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  convertPositionToHour(position: any) {
    const hour = parseInt(position[0]);

    if (hour < 10) {
      return `0${hour}:00`;
    } else if (hour === 24) {
      return '00:00';
    } else {
      return `${hour}:00`;
    }
  }

  async dayAheadPriceTR(data) {
    const json = await parseStringPromise(data);

    const document = json.Publication_MarketDocument;

    const tsArray = document.TimeSeries.map((ts) => ({
      period: {
        timeInterval: {
          start: ts.Period[0].timeInterval[0].start[0],
          end: ts.Period[0].timeInterval[0].end[0],
        },
        point: ts.Period[0].Point.map((po) => ({
          position: parseInt(po.position[0], 10),
          priceAmount: parseFloat(po['price.amount'][0]),
        })),
      },
    }));

    return tsArray;
  }

  async badRequestTR(data: any) {
    const json = await parseStringPromise(data);
    const document = json.Acknowledgement_MarketDocument.Reason[0];

    return {
      code: document.code[0],
      message: document.text[0],
    };
  }

  async unauthorizedTR(data: any) {
    const json = await parseStringPromise(data);

    return json.html.body[0];
  }

  /**
   * Gets the XML response, parses it and stores it in the database
   */
  @Cron(CronExpression.EVERY_DAY_AT_10PM, { name: 'prices' })
  async storePrices() {
    const { document } = await this.getEnergyPrices();

    parseString(document, async (error, result: any) => {
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

      for (const item of todayPrices) {
        let hour = this.convertPositionToHour(item.position);
        const price = parseFloat(item['price.amount'][0]) / 1000;
        let formatDate = moment(periodStart, 'YYYYMMDDHHmm');

        if (hour.startsWith('00')) {
          // day has changed
          formatDate.add(1, 'day');
        }

        const pro1 = this.dbService.energyPrice.create({
          data: {
            date: formatDate.format('YYYY-MM-DD'),
            hour,
            price,
          },
        });
        promises.push(pro1);
      }

      for (const item of nextDayPrices) {
        const hour = this.convertPositionToHour(item.position);
        const price = parseFloat(item['price.amount'][0]) / 1000;

        const formatDate = moment(periodEnd, 'YYYYMMDDHHmm');

        if (hour.startsWith('00')) {
          // day has changed
          formatDate.add(1, 'day');
        }

        const pro2 = this.dbService.energyPrice.create({
          data: {
            date: formatDate.format('YYYY-MM-DD'),
            hour,
            price,
          },
        });

        promises.push(pro2);
      }

      await Promise.allSettled(promises).catch((error) => {
        this.logger.error(error);
        throw new BadRequestException('Error retrieving the prices', error);
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
        select: {
          price: true,
          hour: true,
          date: true,
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
        select: {
          date: true,
          hour: true,
          price: true,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getAllPrices() {
    return await this.dbService.energyPrice.findMany({
      select: {
        price: true,
        hour: true,
        date: true,
      },
    });
  }

  // Get the average price for a specified date, limited to take
  async findAvgPrice(date: string, take?: number) {
    const aggregations = await this.dbService.energyPrice.aggregate({
      _avg: {
        price: true,
      },
      where: {
        date,
      },
      take: take || undefined,
    });

    return aggregations._avg.price.toFixed(4);
  }

  async findPrice(max: boolean, date?: string) {
    const flag = max ? 'desc' : 'asc';

    if (!date) {
      return await this.dbService.energyPrice.findFirst({
        select: {
          price: true,
          hour: true,
          date: true,
        },
        orderBy: {
          price: flag,
        },
      });
    }

    const parsed = new Date(date);

    if (isNaN(parsed.getTime())) {
      throw new NotFoundException('Invalid date format');
    }

    return await this.dbService.energyPrice.findFirst({
      where: {
        date,
      },
      select: {
        price: true,
        hour: true,
        date: true,
      },
      orderBy: {
        price: flag,
      },
    });
  }

  async findPriceForDate(date: string) {
    const parsed = new Date(date);

    if (isNaN(parsed.getTime())) {
      throw new NotFoundException('Invalid date format');
    }

    const prices = await this.dbService.energyPrice.findMany({
      where: {
        date: date,
      },
      select: {
        date: true,
        hour: true,
        price: true,
      },
    });

    return prices;
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
