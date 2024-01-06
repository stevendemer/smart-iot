import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { DbService } from 'src/db/db.service';
import { JwtPayload } from '../types/jwtPayload.type';

export class ATStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.AT_SECRET,
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    return payload;
  }
}
