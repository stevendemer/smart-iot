import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DbService } from '../db/db.service';
import { JwtService } from '@nestjs/jwt';
import { AuthDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { Tokens } from './types/token.type';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtPayload } from './types/jwtPayload.type';
import * as argon2 from 'argon2';
import { User } from '@prisma/client';

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

  async login(dto: User): Promise<any> {
    const payload = {
      sub: dto.id,
      email: dto.email,
    };

    const tokens = await this.generateTokens(dto.id, dto.email);

    return tokens;
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

  async validateUser(email: string, password: string) {
    const user = await this.dbService.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      throw new NotFoundException('Credentials are invalid');
    }
    const isPasswordValid = await argon2.verify(user.hash, password);

    if (!isPasswordValid) {
      throw new ForbiddenException('Credentials are invalid');
    }
    const { hash, hashedRt, ...rest } = user;
    return rest;
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
            throw new ForbiddenException(
              'This email address is already in use.',
            );
          }
        }
        throw new BadRequestException(error);
      });

    const tokens = await this.generateTokens(newUser.id, newUser.email);

    return tokens;
  }

  async refreshToken(user: User) {
    const payload = {
      email: user.email,
      sub: user.id,
    };
    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: '25h',
        secret: process.env.AT_SECRET,
      }),
      refresh_token: this.jwtService.sign(payload, {
        expiresIn: '30d',
        secret: process.env.RT_SECRET,
      }),
    };
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

  async generateTokens(userId: number, email: string): Promise<Tokens> {
    const jwtPayload: JwtPayload = {
      sub: userId,
      email,
    };

    try {
      const [at, rt] = await Promise.all([
        this.jwtService.signAsync(jwtPayload, {
          secret: process.env.AT_SECRET,
          expiresIn: '25h',
        }),
        this.jwtService.signAsync(jwtPayload, {
          secret: process.env.RT_SECRET,
          expiresIn: '30d',
        }),
      ]);

      return {
        access_token: at,
        refresh_token: rt,
      };
    } catch (error) {
      console.error('Something went wrong ', error);
    }
  }
}
