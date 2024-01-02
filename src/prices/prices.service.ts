import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { parseString } from 'xml2js';
import { DbService } from 'src/db/db.service';
import * as moment from 'moment';

/**
 * position 24 -> 22:00 - 23:00
 */

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

    console.log(url);

    const { data, status } = await this.httpService.axiosRef.get(url);

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

  /**
   * Gets the XML response, parses it and stores it in the database
   */
  async storeJSONPrices() {
    const { prices } = await this.getEnergyPrices();
    const { periodEnd, periodStart } = this.getDates();

    parseString(prices, async (error, result: any) => {
      if (error) {
        this.logger.error(
          `Parsing XML error: ${error.message} - stack: ${error.stack}`,
        );
        throw new Error('Error parsing XML data from ENTSOE');
      }

      const timeSeriesArray = result.Publication_MarketDocument.TimeSeries;

      // fields marked with ? are called optional, handle edge cases (day just changed, tomorrow is undefined)
      const todayPrices = timeSeriesArray[0]?.Period?.[0]?.Point || [];

      const nextDayPrices = timeSeriesArray[1]?.Period?.[0]?.Point || [];

      const totalPrices = todayPrices.concat(nextDayPrices);

      const flattenPrices = totalPrices.map((item: any) => {
        return {
          hour: this.convertTimeFormat(item['position'][0]),
          price: (parseFloat(item['price.amount'][0]) / 1000).toFixed(4),
        };
      });

      try {
        const tomorrow = moment(periodEnd, 'YYYYMMDDHHmm').format('DD-MM-YYYY');
        const today = moment(periodStart, 'YYYYMMDDHHmm').format('DD-MM-YYYY');

        await this.dbService.energyPrice.create({
          data: {
            prices: flattenPrices,
            today,
            tomorrow,
          },
        });

        this.logger.log('New prices added to db', flattenPrices);
      } catch (error) {
        this.logger.error(error);
        throw new Error('Error inserting into Prisma');
      }
    });
  }
}
