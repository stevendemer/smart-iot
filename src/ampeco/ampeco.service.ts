import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AmpecoService {
  private logger = new Logger(AmpecoService.name);

  constructor(private readonly httpService: HttpService) {}

  async getChargePoint(chargingPointId: string) {
    this.logger.log('Charge point id: ', chargingPointId);

    try {
      const { data, status } = await this.httpService.axiosRef.get(
        `resources/charge-points/v1.0/${Number(chargingPointId)}`,
      );

      if (status === 401 || status === 403) {
        throw new UnauthorizedException();
      }
      if (status === 404) {
        throw new NotFoundException();
      }

      return data;
    } catch (error) {
      this.logger.error(error);
      throw new Error('Internal server error');
    }
  }

  /**
   *
   * @param chargePointId
   * @param session = the session id returned by the start method
   * @returns
   */
  async stopChargingSession(chargePointId: number, session: number) {
    try {
      const { data, status } = await this.httpService.axiosRef.post(
        `actions/charge-point/v1.0/${chargePointId}/stop/${session}`,
        {
          force: true,
        },
      );

      if (status === 403 || status === 401) {
        throw new UnauthorizedException();
      } else if (status === 404) {
        throw new NotFoundException();
      } else if (status === 406) {
        throw new BadRequestException();
      }
      return data;
    } catch (error) {
      this.logger.error(error);
      throw new Error('Error stopping the charging session');
    }
  }

  /**
   * Reserve an EVSE for charging purposes
   *
   * @param chargingPointId
   * @param evseId
   */
  async reserveChargingPoint(chargingPointId: number, evseId: number) {
    try {
      const { data, status } = await this.httpService.axiosRef.post(
        `actions/charge-point/v1.0/${chargingPointId}/reserve/${evseId}`,
      );

      if (status === 403 || status === 401) {
        throw new UnauthorizedException();
      } else if (status === 404) {
        throw new NotFoundException();
      }
      return data;
    } catch (error) {
      this.logger.error(error);
      throw new Error('Error reserving the charging session');
    }
  }

  /**
   * Start a charging session using the EVSE / Charge point ID
   *
   * @param chargePointId
   * @param evseId
   * @returns The sessionId (number) and success (boolean)
   */
  async startChargingSession(chargePointId: number, evseId: number) {
    try {
      const { data, status } = await this.httpService.axiosRef.post(
        `actions/charge-point/v1.0/${chargePointId}/start/${evseId}`,
      );

      if (status === 403 || status === 401) {
        throw new UnauthorizedException();
      } else if (status === 404) {
        throw new NotFoundException();
      }

      return data;
    } catch (error) {
      this.logger.error(error);
      throw new Error('Error starting the charging session');
    }
  }

  /**
   *
   * Resets the charge point
   *
   * @param chargePointId
   * @param type (hard or soft reset)
   */
  async resetChargePoint(chargePointId: number, type: string = 'soft') {
    try {
      const { data, status } = await this.httpService.axiosRef.get(
        `actions/charge-point/v1.0/${chargePointId}/reset/${type}`,
      );

      if (status === 403 || status === 401) {
        throw new UnauthorizedException();
      } else if (status === 404) {
        throw new NotFoundException();
      }
      return data;
    } catch (error) {
      this.logger.error(error);
      throw new Error('Error stopping the charging session');
    }
  }

  /**
   * Checks the hardware and network status of the charging point
   * @param chargePointId
   * @returns The hardwareStatus(string), the evses connected, and networkStatus(string) and the lastUpdatedAt (Date)
   */
  async chargePointStatus(chargePointId: number) {
    try {
      const { data, status } = await this.httpService.axiosRef.get(
        `resources/charge-points/v1.0/${chargePointId}/status`,
      );

      if (status === 403 || status === 401) {
        throw new UnauthorizedException();
      } else if (status === 404) {
        throw new NotFoundException();
      }

      return data;
    } catch (error) {
      this.logger.error(error);
      throw new Error('Error stopping the charging session');
    }
  }

  /**
   *
   * @param sessionId - the id returned by the startCharging action
   * @returns
   */
  async getSessionInfo(sessionId: string) {
    try {
      const { data, status } = await this.httpService.axiosRef.get(
        `resources/sessions/v1.0/${sessionId}`,
      );
      if (status === 401 || status === 403) {
        throw new UnauthorizedException();
      } else if (status === 404) {
        throw new NotFoundException();
      }

      return data;
    } catch (error) {
      this.logger.error(error);
      throw new Error('Error getting session info');
    }
  }
}
