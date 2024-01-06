import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { Public } from './decorators/public.decorator';
import { RefreshTokenGuard } from './guards/rt.guard';
import { GetCurrentUserId } from './decorators/get-current-user-id.decorator';
import { GetCurrentUser } from './decorators/get-current-user.decorator';
import { Tokens } from './types/token.type';
import { ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from './guards/at.guard';

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('/signup')
  @HttpCode(HttpStatus.CREATED)
  signUp(@Body() dto: AuthDto): Promise<Tokens> {
    return this.authService.signUp(dto);
  }

  @Public()
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  signIn(@Body() dto: AuthDto): Promise<Tokens> {
    return this.authService.login(dto);
  }

  @Post('/logout')
  logout(@GetCurrentUserId() userId: number): Promise<boolean> {
    return this.authService.logout(userId);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/hello')
  async hello() {
    return {
      msg: 'Hello world',
    };
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('/refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @GetCurrentUserId() userId: number,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ): Promise<Tokens> {
    return this.authService.refreshTokens(userId, refreshToken);
  }
}
