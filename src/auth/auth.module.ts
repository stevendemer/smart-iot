import { LocalStrategy } from './strategies/local.strategy';
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ATStrategy } from './strategies/at.strategy';
import { RTStrategy } from './strategies/rt.strategy';
import { AuthController } from './auth.controller';

@Module({
  imports: [JwtModule.register({})],
  providers: [AuthService, ATStrategy, RTStrategy, LocalStrategy],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
