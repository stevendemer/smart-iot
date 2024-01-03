import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TokenService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  private token: string = '';
  private expiration: Date = null;

  getToken(): string {
    return this.token;
  }

  setToken(token: string) {
    this.token = token;
  }

  getExpiration(): Date {
    return this.expiration;
  }

  setExpiration(expiration: Date) {
    this.expiration = expiration;
  }

  async refreshToken(): Promise<void> {
    const userName = this.configService.get<string>('HUAWEI_USERNAME');
    const systemCode = this.configService.get<string>('HUAWEI_PASS');

    const { data, status, headers } = await firstValueFrom(
      this.httpService.post('/login', {
        userName,
        systemCode,
      }),
    );

    if (data.success === true) {
      const token = headers['xsrf-token'];

      const expirationTime = moment().add('30', 'minutes').toDate();

      this.setExpiration(expirationTime);
      this.setToken(token);
    } else {
      throw new BadRequestException();
    }
  }

  async isExpired(): Promise<boolean> {
    const now = moment();

    if (moment(now).isAfter(this.expiration)) {
      console.log('Token has expired');
      return true;
    }

    return false;
  }
}
