import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { JwtPayload } from '../types/jwtPayload.type';
import { JwtPayloadWithRt } from '../types/jwtPayloadWithRt.type';

export class RTStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    // const secret = this.configService.get<string>('RT_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.RT_SECRET,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): JwtPayloadWithRt {
    const refreshToken = req
      ?.get('authorization')
      ?.replace('Bearer', '')
      .trim();

    if (!refreshToken) {
      throw new ForbiddenException('Refresh token malformed');
    }

    return {
      ...payload,
      refreshToken,
    };
  }
}
