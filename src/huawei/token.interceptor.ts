import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import {
  Observable,
  tap,
  map,
  switchMap,
  firstValueFrom,
  lastValueFrom,
  forkJoin,
} from 'rxjs';
import { HuaweiService } from './huawei.service';
import { ConfigService } from '@nestjs/config';

/**
 * Reads each response that falls under the /huawei controller,
 * and checks if the failCode returned from the API equals to 305 (token has expired)
 *
 */
@Injectable()
export class TokenInterceptor implements NestInterceptor {
  constructor(
    private readonly huaweiService: HuaweiService,
    private readonly configService: ConfigService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    console.log('Before running interceptor...');
    return next.handle().pipe(
      map(async (data) => {
        const { failCode, ...rest } = data;
        if (failCode === 305) {
          // re-login
          await this.huaweiService.login();
        } else {
          console.log('No need to relogin');
        }
      }),
    );
  }
}
