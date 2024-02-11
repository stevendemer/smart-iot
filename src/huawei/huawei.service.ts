import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DbService } from '../db/db.service';
import * as moment from 'moment';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * The returned token from the SmartPVMS has a TTL of 30 minutes
 * so we need to relogin when needed
 */
@Injectable()
export class HuaweiService {
  private logger: Logger = new Logger(HuaweiService.name);
  private token: string | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly dbService: DbService,
    private readonly configService: ConfigService,
  ) {
    this.setupInterceptors();
  }

  private setToken(token: string) {
    this.token = token;
  }

  private setupInterceptors() {
    let isLoginIn = false;

    this.httpService.axiosRef.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // console.log('Inside request config: ', this.token);
        config.headers['XSRF-TOKEN'] = this.token;
        return config;
      },
    );

    this.httpService.axiosRef.interceptors.response.use(
      async (response: AxiosResponse) => {
        if (response.data.failCode === 305) {
          if (!isLoginIn) {
            isLoginIn = true;

            await this.login();

            response.config.headers['XSRF-TOKEN'] = this.token;

            return await this.httpService.axiosRef.request(response.config);
          }

          return response;
        } else {
          return response;
        }
      },
    );
  }

  /**
   * Five times every 10 minutes per user allowed
   */
  async login() {
    const userName = this.configService.get<string>('HUAWEI_USERNAME');
    const systemCode = this.configService.get<string>('HUAWEI_PASS');

    const response = await this.httpService.axiosRef.post('/login', {
      userName,
      systemCode,
    });

    const { failCode, success, ...rest } = response.data;

    if (failCode === 0) {
      try {
        const token = response.headers['xsrf-token'];
        // the token from the API is set to expire in 30 minutes
        const expirationDate = moment().add(30, 'minutes').toDate();

        this.setToken(token);

        // the following query creates a new PVAccount if it's the first login,
        // else updates the token and its expiration date
        await this.dbService.pVAccount.upsert({
          where: {
            username: userName,
          },
          update: {
            token,
          },
          create: {
            token,
            username: userName,
            expiration: expirationDate,
          },
        });

        return {
          token,
          message: 'Logged in',
          failCode,
        };
      } catch (error) {
        this.logger.error(error);
        throw error;
      }
    } else {
      this.logger.error(
        `Huawei login failed with status ${
          response.status
        } and response: ${JSON.stringify(response.data, null, 2)}`,
      );
      throw new BadRequestException();
    }
  }

  async getToken() {
    const username = this.configService.get<string>('HUAWEI_USERNAME');
    const { token, expiration } = await this.dbService.pVAccount.findFirst({
      where: {
        username,
      },
    });

    return { token, expiration };
  }

  // Retrieve the real time data from the inverter
  @Cron(CronExpression.EVERY_HOUR, { name: 'huawei' })
  async storeDevRealTime() {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(
          'https://eu5.fusionsolar.huawei.com/thirdData/getDevRealKpi',
          {
            devIds: 'NE=36653898',
            devTypeId: '1',
          },
        ),
      );

      if (data.success !== true) {
        return {
          message: 'Request failed',
          failCode: data.failCode,
        };
      }

      let username = this.configService.get<string>('HUAWEI_USERNAME');

      const account = await this.dbService.pVAccount.findFirst({
        where: {
          username,
        },
      });

      if (!account) {
        await this.login();
      }

      if (data.data === null) {
        return {
          message: 'Data is null',
          code: data.failCode,
        };
      }

      let itemMap = data.data[0]['dataItemMap'];
      let devId = data.data[0]['devId'];

      const newPvReading = await this.dbService.pVReading.create({
        data: {
          account: {
            connect: {
              username,
            },
          },
          devId,
          activePower: itemMap.active_power,
          efficiency: itemMap.efficiency,
          inverterState: itemMap.inverter_state,
          // total dc input energy (used for efficiency and performance)
          totalInputPower: itemMap.mppt_power,
          reactivePower: itemMap.reactive_power,
          // final total yield
          totalYield: itemMap.total_cap,
          devTypeId: 1,
          runState: itemMap.run_state === 1 ? true : false,
        },
      });

      return newPvReading;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getAll() {
    return await this.dbService.pVReading.findMany({});
  }

  async getReadingByDate(date: string) {
    const searchDate = new Date(date);

    const dateString = searchDate.toISOString().split('T')[0];

    console.log('The date string ', dateString);

    return await this.dbService.pVReading.findMany({
      where: {
        createdAt: {
          gte: new Date(`${dateString}T00:00:00.000Z`),
          lt: new Date(`${dateString}T23:59:59.000Z`),
        },
      },
    });
  }

  async getDeviceReadings(id: number) {
    const readings = await this.dbService.pVReading.findMany({
      where: {
        devId: id,
      },
      select: {
        activePower: true,
        efficiency: true,
        inverterState: true,
        reactivePower: true,
        runState: true,
        totalInputPower: true,
        totalYield: true,
      },
    });
    return readings;
  }

  async getStations() {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post('stations', {
          pageNo: 1,
          pageCount: 50,
        }),
      );

      return data;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
