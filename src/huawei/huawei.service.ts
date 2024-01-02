import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DbService } from '../db/db.service';
import * as moment from 'moment';
import { ConfigService } from '@nestjs/config';
import {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

interface IResponse {
  failCode: number;
  success: boolean;
  token?: string;
  message?: string;
}

/**
 * The returned token from the SmartPVMS has a TTL of 30 minutes,
 * the failCode attribute is vital for the refresh logic. An interceptor
 * reads each response from the API and if the failCode === 305 the token has expired,
 * so we need to relogin (validateToken)
 */
@Injectable()
export class HuaweiService {
  private logger: Logger = new Logger(HuaweiService.name);
  private stationCodes = 'NE=36653898';
  private token = '';
  private axios = null;

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
    // this.httpService.axiosRef.interceptors.request.use(
    //   async (config: InternalAxiosRequestConfig) => {
    //     // const { token } = await this.dbService.pVReading.findFirst({});
    //     const { token } = await this.login();
    //     config.headers['XSRF-TOKEN'] = token;
    //     return config;
    //   },
    //   (error: AxiosError) => {
    //     return Promise.reject(error);
    //   },
    // );

    this.httpService.axiosRef.interceptors.response.use(
      async (response: AxiosResponse) => {
        if (response.data && response.data.failCode === 305) {
          console.log('Inside response: ', response.data.failCode);
          const { token } = await this.login();
          response.config.headers['XSRF-TOKEN'] = token;
          console.log('Modified config : ', response.config);
          // retry the request - works so far
          return await this.httpService.axiosRef.request(response.config);
        }
        return response;
      },
    );
  }

  async login() {
    console.log('Inside login');
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
        // const expirationDate = moment().add(30, 'minutes').toDate();

        this.setToken(token);

        // the following query creates a new pvReading on the first login,
        // else update the token and its expiration date
        await this.dbService.pVReading.upsert({
          where: {
            username: userName,
          },
          update: {
            token,
          },
          create: {
            token,
            username: userName,
          },
        });

        return {
          token,
          message: 'Logged in',
          failCode,
        };
      } catch (error) {
        this.logger.error(error);
        throw new InternalServerErrorException();
      }
    } else {
      this.logger.error(
        `Huawei login failed with status ${response.status} and response: ${response.data}`,
      );
      throw new BadRequestException();
    }
  }

  // /**
  //  *
  //  * @param context
  //  * @param response
  //  * Reads the response returned from the Huawei API and checks if the token needs to be refreshed
  //  */
  // async validateToken(context: ExecutionContext, response: any) {
  //   if (response.failCode === 305) {
  //     // user must relogin
  //     console.log('Logging in again...');
  //     const username = this.configService.get<string>('HUAWEI_USERNAME');
  //     const password = this.configService.get<string>('HUAWEI_PASS');

  //     return await this.login(username, password);
  //   }
  //   console.log('[RESPONSE] = ', response);
  // }

  async hello() {
    return {
      failCode: 0,
      message: 'Hello from huawei',
    };
  }

  async getRealStationKpi() {
    const pv = await this.dbService.pVReading.findFirst({});
    try {
      const { data, status } = await this.httpService.axiosRef.post(
        'getDevRealKpi',
        {
          devIds: 1000000036653900,
          devTypeId: 1,
          collectTime: 3600000,
        },
      );

      return data;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  /**
   * @param devId
   * Retrieves the realtime data from a device for one hour
   *
   */
  async getDeviceRealTime(devId: number) {
    try {
    } catch (error) {}
  }
}
