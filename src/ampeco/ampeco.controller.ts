import { Controller, Get, Param, Post } from '@nestjs/common';
import { AmpecoService } from './ampeco.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('ampeco')
@Controller('ampeco')
export class AmpecoController {
  constructor(private readonly ampecoService: AmpecoService) {}

  @Get('/charge-point/:id')
  async findChargePoint(@Param('id') id: number) {
    return this.ampecoService.getChargePoint(id);
  }

  @Get('/charge-point/:id/status')
  async getPointStatus(@Param('id') id: number) {
    return this.ampecoService.chargePointStatus();
  }

  @Post('/start')
  async startCharging() {
    let chargePointId = 63205; // RENEL-IKE Thess
    let evseNetworkId = 1;

    return await this.ampecoService.startChargingSession(
      chargePointId,
      evseNetworkId,
    );
  }

  @Post('/stop')
  async stopCharging() {
    let chargePointId = 63205; // RENEL-IKE Thess
    let evseNetworkId = 1;

    return await this.ampecoService.stopChargingSession(
      chargePointId,
      evseNetworkId,
    );
  }

  @Get('/store')
  storeSession() {
    return this.ampecoService.storeSessionInfo();
  }

  // @Post('/charge-point/:chargePointId/stop/:evseId')
  // async stopCharging(
  //   @Param('chargePointId') chargePointId: number,
  //   @Param('evseId') evseId: number,
  // ) {
  //   return this.ampecoService.stopChargingSession();
  // }

  // @Get('/session/:sessionId/status')
  // async findSession(@Param('sessionId') sessionId: string) {
  //   return this.ampecoService.getSessionInfo(sessionId);
  // }
}
