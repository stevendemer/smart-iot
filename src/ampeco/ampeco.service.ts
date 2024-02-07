import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { DbService } from '../db/db.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChargeSessionEvent } from '../notifications/charge-session.event';

@Injectable()
export class AmpecoService {
  private logger = new Logger(AmpecoService.name);
  private sessionId: string = '';
  private isCharging = false;

  constructor(
    private readonly httpService: HttpService,
    private readonly dbService: DbService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   *
   * @param chargePointId
   */
  async stopChargingSession(chargePointId: number) {
    try {
      if (!this.isCharging) {
        return {
          message: 'No charging session found',
          success: false,
        };
      }

      const { data, status } = await firstValueFrom(
        this.httpService
          .post(
            `actions/charge-point/v1.0/${chargePointId}/stop/${this.sessionId}`,
            {
              force: true,
            },
          )
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(error);
              throw error;
            }),
          ),
      );

      // trigger event
      const chargeSessionEvent = new ChargeSessionEvent(false);
      // chargeSessionEvent.isCharging = false;

      this.eventEmitter.emit('charging.stopped', chargeSessionEvent);

      return {
        message: 'Charging has stopped',
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  /**
   * Reserve an EVSE for charging purposes
   *
   * @param chargePointId
   * @param evseId
   */
  async reserveChargingPoint(chargePointId: number, evseId: number) {
    try {
      const { data, status } = await firstValueFrom(
        this.httpService.post(
          `actions/charge-point/v1.0/${chargePointId}/reserve/${evseId}`,
        ),
      );

      if (status === 403 || status === 401) {
        throw new UnauthorizedException();
      } else if (status === 404) {
        throw new NotFoundException();
      }
      return data;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async isCurrentlyCharging(id: number) {
    try {
      const { data, status } = await firstValueFrom(
        this.httpService.get(`resources/charge-points/v1.0/${id}/status`),
      );

      const hardwareStatus = data.data['evses'][0]['hardwareStatus'];

      if (hardwareStatus === 'charging') {
        console.log(`Point: ${id} is charging`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  /**
   * Start a charging session using the EVSE network ID / Charge point ID
   *
   * @param pointId: charge point id
   * @param evseNetworkid
   * @returns The sessionId
   */
  async startChargingSession(chargePointId: number, evseNetworkId: number) {
    try {
      const { data, status } = await firstValueFrom(
        this.httpService
          .post(
            `actions/charge-point/v1.0/${chargePointId}/start/${evseNetworkId}`,
            // `https://f5b0ad54-ce3f-419b-bc0f-820c8219f4ed.mock.pstmn.io/ampeco/start`,
          )
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(error);
              throw error;
            }),
          ),
      );

      if (status !== 202) {
        return {
          message: data.message,
          success: false,
        };
      }

      this.isCharging = true;
      this.sessionId = data.sessionId;

      // trigger event
      const chargeSessionEvent = new ChargeSessionEvent(true, data.sessionId);

      this.eventEmitter.emit('charging.started', chargeSessionEvent);

      return {
        sessionId: this.sessionId,
        charging: this.isCharging,
        message: 'Charging session has started',
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  /**
   * Checks the hardware and network status of the charging point
   * @param id: charge point id
   * @returns The hardwareStatus, the evses connected, and the networkStatus
   */
  async chargePointStatus(chargePointId: number) {
    try {
      const { data } = await firstValueFrom(
        this.httpService
          .get(`resources/charge-points/v1.0/${chargePointId}/status`)
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(error.message);
              throw error;
            }),
          ),
      );

      return data;
    } catch (error) {
      this.logger.error(error);
      throw new Error('Error stopping the charging session');
    }
  }

  async storeSessionInfo() {
    try {
      if (this.isCharging && this.sessionId) {
        console.log('The session id is', this.sessionId);

        const { data, status } = await firstValueFrom(
          this.httpService
            .get(
              process.env.AMPECO_BASE_URI +
                `resources/sessions/v1.0/${this.sessionId}`,
            )
            .pipe(
              catchError((error: AxiosError) => {
                this.logger.error(error.message);
                throw error;
              }),
            ),
        );

        let resp = data.data;

        console.log('The session object is ', resp);

        if (
          resp.status === 'finished' ||
          resp.status === 'failed ' ||
          resp.status === 'expired'
        ) {
          const chargeSessionEvent = new ChargeSessionEvent(false);

          this.eventEmitter.emit('charging.stopped', chargeSessionEvent);
          return {
            message: 'Charging has stopped',
            status: resp.status,
          };
        }

        await this.dbService.ampecoSession.create({
          data: {
            chargePointId: this.configService.get<number>('CHARGEPOINT_ID'),
            electricityCost: resp.electricityCost,
            energy: resp.energy,
            powerKw: resp.powerKw,
            socPercent: resp.socPercent,
            evseId: this.configService.get<number>('EVSE_ID'),
            amount: resp.amount,
            startedAt: resp.startedAt,
            stoppedAt: resp.stoppedAt,
            sessionId: Number(this.sessionId),
          },
        });

        return {
          message: 'Session info stored',
          success: true,
        };
      } else {
        return {
          message: 'Charging session has not started',
          success: false,
        };
      }
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error);
    }
  }

  async getSessionById(id: number) {
    try {
      const session = await this.dbService.ampecoSession.findMany({
        where: {
          sessionId: id,
        },
      });

      return session;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async readSessionInfo() {
    try {
      const { data, status } = await firstValueFrom(
        this.httpService.get(`resources/sessions/v1.0`).pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.message);
            throw error;
          }),
        ),
      );

      if (status === 401 || status === 403 || status === 422) {
        throw new UnauthorizedException(data.message);
      }

      const resp = data.data;

      // make sure the request was a success and there are sessions found
      if (resp.length > 0 && resp.status === 'active') {
        const sessionObj = resp[resp.length - 1];
        console.log('Latest session is ', sessionObj);
        this.sessionId = sessionObj.id;
        // const chargeEvent = new ChargeSessionEvent(true, lastSessionObj.id);

        // await this.dbService.ampecoSession.create({
        //   data: {
        //     amount,
        //     energy,
        //     powerKw,
        //     socPercent,
        //     electricityCost,
        //     startedAt,
        //     stoppedAt,
        //     chargePointId,
        //     evseId,
        //     sessionId,
        //   },
        // });

        await this.dbService.ampecoSession.create({
          data: {
            energy: sessionObj.energy,
            powerKw: sessionObj.powerKw,
            sessionId: sessionObj.id,
            amount: sessionObj.amount,
            electricityCost: sessionObj?.electricityCost,
            socPercent: sessionObj?.socPercent,
            startedAt: sessionObj.startedAt,
            stoppedAt: sessionObj?.stoppedAt,
            evseId: sessionObj.evseId,
            chargePointId: sessionObj.chargePointId,
          },
        });

        console.log('Session info stored');
        return true;
      } else {
        // this.eventEmitter.emit(
        //   'charging.stopped',
        //   new ChargeSessionEvent(false),
        // );

        console.log('No active session found');
        return false;
      }
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getStoredSessions() {
    try {
      const sessions = await this.dbService.ampecoSession.findMany({});
      return sessions;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getChargePointById(id: number) {
    try {
      const { data, status } = await firstValueFrom(
        this.httpService.get(`resources/charge-points/v1.0/${id}`),
      );

      if (status === 404) {
        throw new NotFoundException();
      } else if (status === 401 || status === 403) {
        throw new ForbiddenException();
      }
      return data;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
