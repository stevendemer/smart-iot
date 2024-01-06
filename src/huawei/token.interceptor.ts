import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TokenService } from './token.service';

/**
 * Reads each response that falls under the /huawei controller,
 * and checks if the failCode returned from the API equals to 305 (token has expired)
 *
 */
@Injectable()
export class TokenInterceptor implements NestInterceptor {
  constructor(private readonly tokenService: TokenService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const token = this.tokenService.getToken();
    const request = context.switchToHttp().getRequest();

    if (token && !this.tokenService.isExpired()) {
      console.log('Token is fine');
      request.headers['XSRF-TOKEN'] = token;
    } else {
      console.log('Token has expired');
      // if the token has expired or is not present, refresh it
      await this.tokenService.refreshToken();
      const token = this.tokenService.getToken();

      request.headers['XSRF-TOKEN'] = token;
      console.log(request);
    }
    return next.handle();
  }
}
