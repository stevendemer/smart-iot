import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { parseString } from 'xml2js';
import { DbService } from '../db/db.service';
import * as moment from 'moment';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PricesService {
  private logger = new Logger(PricesService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly dbService: DbService,
  ) {}

  /**
   * @returns the start and end period for the day ahead prices
   */
  getDates() {
    const startOfDay = moment().startOf('day').add(22, 'h');

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
  async generateURL() {
    const { periodEnd, periodStart } = this.getDates();
    this.logger.log(`Period: ${periodStart} - ${periodEnd}`);

    return `https://web-api.tp.entsoe.eu/api?documentType=A44&out_Domain=10YGR-HTSO-----Y&in_Domain=10YGR-HTSO-----Y&periodStart=${periodStart}&periodEnd=${periodEnd}&securityToken=${process.env.ENTSOE_API_TOKEN}`;
  }

  printJSON(object: any) {
    for (let key in object) {
      if (typeof object[key] === 'object') {
        this.printJSON(object[key]);
      } else {
        console.log(object[key]);
      }
    }
  }

  /**
   *
   * @param {string} hour - The hour in 24-hour format('24')
   * @returns {string} The digital clock format (01:00 AM) from the hour
   * e.g 1 -> 01:00 AM
   */
  convertTimeFormat(hour: string) {
    const formattedHour = moment(hour, 'HH').format('hh:mm A');
    return formattedHour;
  }

  /**
   *
   * @returns The energy price (euro / kwh) for one day ahead
   */
  async getEnergyPrices() {
    const url = await this.generateURL();

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
    const hour = parseInt(position[0]) - 1;
    return hour < 10 ? `0${hour}:00` : `${hour}:00`;
  }

  /**
   * Gets the XML response, parses it and stores it in the database
   */
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

      todayPrices.map(async (item) => {
        const hour = this.convertPositionToHour(item.position);
        const price = parseFloat(item['price.amount'][0]);

        const formatDate = moment(periodStart, 'YYYYMMDDHHmm').format(
          'YYYY-MM-DD',
        );

        await this.dbService.energyPrice
          .create({
            data: {
              date: formatDate,
              hour,
              price,
            },
          })
          .catch((error) => {
            this.logger.error(error);
            throw error;
          });
      });

      nextDayPrices.map(async (item) => {
        const hour = this.convertPositionToHour(item.position);
        const price = parseFloat(item['price.amount'][0]);

        const formatDate = moment(periodEnd, 'YYYYMMDDHHmm').format(
          'YYYY-MM-DD',
        );

        await this.dbService.energyPrice
          .create({
            data: {
              date: formatDate,
              hour,
              price,
            },
          })
          .catch((error) => {
            this.logger.error(error);
            throw error;
          });
      });
    });
  }

  async findCurrentHourPrice() {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const hour = now.getHours().toString().padStart(2, '0') + ':00';
    console.log(hour);
    console.log(date);

    return this.dbService.energyPrice
      .findFirst({
        where: {
          date,
          hour,
        },
      })
      .catch((error) => {
        this.logger.error(error);
        throw error;
      });
  }
}
