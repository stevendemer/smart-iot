import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom, lastValueFrom } from 'rxjs';
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
              throw new HttpException('Failed to stop charging', status);
            }),
          ),
      );

      // trigger event
      const chargeSessionEvent = new ChargeSessionEvent(false);

      this.eventEmitter.emit('charging.stopped', chargeSessionEvent);

      return {
        message: 'Charging has stopped',
      };
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        'Failed to stop the charging session',
        HttpStatus.BAD_REQUEST,
      );
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
      throw new HttpException(
        'Failed to reserver charging point',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async isCurrentlyCharging(id: number) {
    try {
      const { data, status } = await firstValueFrom(
        this.httpService.get(`resources/charge-points/v1.0/${id}/status`),
      );

      const hardwareStatus = data.data['evses'][0]['hardwareStatus'];

      if (hardwareStatus === 'charging') {
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
          )
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(error);
              throw new HttpException(
                'Failed to start charging session',
                status,
              );
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
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
              throw new HttpException(
                'Failed to get the charging point status',
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      return data;
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        'Something went wrong ',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async storeSessionInfo() {
    try {
      if (this.isCharging && this.sessionId) {
        const { data, status } = await firstValueFrom(
          this.httpService
            .get(
              process.env.AMPECO_BASE_URI +
                `resources/sessions/v1.0/${this.sessionId}`,
            )
            .pipe(
              catchError((error: AxiosError) => {
                this.logger.error(error.message);
                throw new HttpException(
                  'Failed to get session info with id ' + this.sessionId,
                  status,
                );
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
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
  }

  async getSessionById(id: string) {
    try {
      const session = await this.dbService.ampecoSession.findMany({
        where: {
          sessionId: id,
        },
      });

      return session;
    } catch (error) {
      this.logger.error(error);
    }
  }

  async readSessionInfo() {
    try {
      const { data, status } = await firstValueFrom(
        this.httpService.get(`resources/sessions/v1.0`).pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.message);
            throw new HttpException(error.message, error.status);
          }),
        ),
      );

      if (status === 401 || status === 403 || status === 422) {
        throw new UnauthorizedException(data.message);
      }

      const resp = data.data;

      const latestSession = resp[resp.length - 1];

      const lastStoredSession = await this.dbService.ampecoSession.findFirst({
        where: {
          sessionId: latestSession.id,
        },
      });

      this.sessionId = latestSession.id;

      if (lastStoredSession && latestSession.status === 'finished') {
        // no new charging session started, let it retry for 3 times
        console.log('No new session found! Retrying...');
        return false;
      }

      if (latestSession.status === 'finished') {
        // const sessionObject = resp[resp.length - 1];

        await this.dbService.ampecoSession.create({
          data: {
            energy: latestSession.energy,
            powerKw: latestSession.powerKw,
            sessionId: latestSession.id,
            amount: latestSession.amount,
            electricityCost: latestSession?.electricityCost,
            socPercent: latestSession?.socPercent,
            startedAt: latestSession.startedAt,
            stoppedAt: latestSession.stoppedAt,
            evseId: latestSession.evseId,
            chargePointId: latestSession.chargePointId,
            status: latestSession.status,
          },
        });

        console.log('Charging session has been saved');

        this.eventEmitter.emit('charging.stopped');

        return false;
      } else if (latestSession.status === 'active') {
        this.sessionId = latestSession.id;

        console.log('Charging session is active');

        await this.dbService.ampecoSession.create({
          data: {
            energy: latestSession.energy,
            powerKw: latestSession.powerKw,
            sessionId: latestSession.id,
            amount: latestSession.amount,
            electricityCost: latestSession?.electricityCost,
            socPercent: latestSession?.socPercent,
            startedAt: latestSession.startedAt,
            stoppedAt: latestSession.stoppedAt,
            evseId: latestSession.evseId,
            chargePointId: latestSession.chargePointId,
            status: latestSession.status,
          },
        });

        return true;
      } else if (latestSession.status === 'pending') {
        console.log('Charging session is pending');
      } else {
        console.log('No active session found');
        this.eventEmitter.emit('charging.stopped');
        return false;
      }
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message || 'Error storing session', 500);
    }
  }

  async getStoredSessions() {
    try {
      const sessions = await this.dbService.ampecoSession.findMany({});
      if (sessions.length === 0) {
        throw new NotFoundException('No stored sessions in the database');
      }
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
