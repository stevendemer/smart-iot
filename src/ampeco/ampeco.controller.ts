import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { AmpecoService } from './ampeco.service';
import { ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/at.guard';
import { UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@UseGuards(AccessTokenGuard)
@ApiTags('Ampeco')
@Controller('ampeco')
export class AmpecoController {
  constructor(private readonly ampecoService: AmpecoService) {}

  @Get('/charge-point/:id')
  async findChargePoint(@Param('id') id: number) {
    return this.ampecoService.getChargePointById(id);
  }

  @Get('/charge-point/:id/status')
  async getPointStatus(@Param('id') id: number) {
    return this.ampecoService.chargePointStatus(id);
  }

  @Post('/stop/:id')
  async stopCharging(@Param('id') id: number) {
    return await this.ampecoService.stopChargingSession(id);
  }

  @Post('/start/:id/:evseId')
  async startCharging(
    @Param('id') id: number,
    @Param('evseId') evseId: number,
  ) {
    return await this.ampecoService.startChargingSession(id, evseId);
  }

  @Get('/session/:id')
  async findSession(@Param('id') id: number) {
    // return await this.ampecoService.storeSessionInfo();
    const session = await this.ampecoService.getSessionById(id);
    if (!session) {
      throw new NotFoundException();
    }
    return session;
  }

  @Get('/sessions')
  async findAllSessions() {
    return this.ampecoService.getStoredSessions();
  }
}
