import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { RefreshTokenGuard } from './guards/rt.guard';
import { GetCurrentUserId } from './decorators/get-current-user-id.decorator';
import { Tokens } from './types/token.type';
import { ApiTags } from '@nestjs/swagger';
import { LocalAuthGuard } from './guards/local.guard';

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  @HttpCode(HttpStatus.CREATED)
  signUp(@Body() dto: AuthDto): Promise<Tokens> {
    return this.authService.signUp(dto);
  }

  @Post('/login')
  @UseGuards(LocalAuthGuard)
  signIn(@Request() req): Promise<Tokens> {
    return this.authService.login(req.user);
  }

  @Post('/logout')
  logout(@GetCurrentUserId() userId: number): Promise<boolean> {
    return this.authService.logout(userId);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('/refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    // @GetCurrentUserId() userId: number,
    // @GetCurrentUser('refreshToken') refreshToken: string,
    @Request() req,
  ): Promise<Tokens> {
    // return this.authService.refreshTokens(userId, refreshToken);
    return this.authService.refreshToken(req.user);
  }
}
