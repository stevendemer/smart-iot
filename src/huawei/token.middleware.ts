import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class TokenMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const original = res.send;

    res.send = function (body: any) {
      if (body && body.failCode === 305) {
        console.log('Need to relogin');
      }
      return original.apply(res, arguments);
    };

    next();
  }
}
