import {
  ForbiddenException,
  Injectable,
  ExceptionFilter,
} from '@nestjs/common';
import { DbService } from '../db/db.service';
import { JwtService } from '@nestjs/jwt';
import { AuthDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { Tokens } from './types/token.type';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtPayload } from './types/jwtPayload.type';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private readonly dbService: DbService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  hashBody(data: string) {
    return argon2.hash(data);
  }

  async logout(userId: number): Promise<boolean> {
    await this.dbService.user.updateMany({
      where: {
        id: userId,
        hashedRt: {
          not: null,
        },
      },
      data: {
        hashedRt: null,
      },
    });
    return true;
  }

  async signUp(dto: AuthDto): Promise<Tokens> {
    const hash = await this.hashBody(dto.password);

    const newUser = await this.dbService.user
      .create({
        data: {
          email: dto.email,
          hash,
        },
      })
      .catch((error) => {
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new ForbiddenException('Credentials are incorrect');
          }
        }
        throw error;
      });

    const tokens = await this.getTokens(newUser.id, newUser.email);

    return tokens;
  }

  async login(dto: AuthDto): Promise<Tokens> {
    const user = await this.dbService.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    const passwordMatches = await argon2.verify(user.hash, dto.password);

    if (!passwordMatches) {
      throw new ForbiddenException('Access denied');
    }

    const tokens = await this.getTokens(user.id, user.email);

    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }

  async refreshTokens(userId: number, rt: string): Promise<Tokens> {
    console.log('Inside refresh tokens');
    const user = await this.dbService.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.hashedRt) {
      throw new ForbiddenException('Access denied');
    }

    const rtMatches = await argon2.verify(user.hashedRt, rt);

    if (!rtMatches) {
      throw new ForbiddenException('Access denied');
    }

    const tokens = await this.getTokens(user.id, user.email);

    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }

  async updateRtHash(userId: number, rt: string): Promise<void> {
    const hash = await argon2.hash(rt);

    await this.dbService.user.update({
      where: {
        id: userId,
      },
      data: {
        hashedRt: hash,
      },
    });
  }

  async getTokens(userId: number, email: string): Promise<Tokens> {
    const jwtPayload: JwtPayload = {
      sub: userId,
      email,
    };

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get<string>('AT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get<string>('RT_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }
}
