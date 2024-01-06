import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { DbService } from '../db/db.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChargeSessionEvent } from 'src/events/charge-session.event';

@Injectable()
export class AmpecoService {
  private logger = new Logger(AmpecoService.name);
  private chargePointId = 63205; // RENEL-IKE Thess
  private evseNetworkId = 1;

  constructor(
    private readonly httpService: HttpService,
    private readonly dbService: DbService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getChargePoint(chargingPointId: number) {
    console.log(typeof chargingPointId);
    try {
      const { data } = await firstValueFrom(
        this.httpService
          .get(`resources/charge-points/v1.0/${chargingPointId}`)
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(error);
              throw error;
            }),
          ),
      );

      return data;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  /**
   *
   * @param chargePointId
   * @param session
   */
  async stopChargingSession(chargePointId: number, sessionId: number) {
    try {
      const { data, status } = await firstValueFrom(
        this.httpService
          .get(
            // `actions/charge-point/v1.0/${chargePointId}/stop/${sessionId}`,
            'https://f5b0ad54-ce3f-419b-bc0f-820c8219f4ed.mock.pstmn.io/ampeco/stop',
            // {
            //   force: true,
            // },
          )
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(error);
              throw error;
            }),
          ),
      );

      // trigger event
      const chargeSessionEvent = new ChargeSessionEvent();
      chargeSessionEvent.isCharging = false;

      this.eventEmitter.emit('charging.stopped', chargeSessionEvent);

      return {
        message: 'Charging has stopped',
        success: true,
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
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
      const { data, status } = await firstValueFrom(
        this.httpService.post(
          `actions/charge-point/v1.0/${chargingPointId}/reserve/${evseId}`,
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

  /**
   * Start a charging session using the EVSE network ID / Charge point ID
   *
   * @param chargePointId
   * @param evseNetworkid
   * @returns The sessionId
   */
  async startChargingSession(chargePointId?: number, evseNetworkId?: number) {
    try {
      console.log('Started charging...');
      const { data, status } = await firstValueFrom(
        this.httpService
          .get(
            // `actions/charge-point/v1.0/${chargePointId}/start/${evseNetworkId}`,
            'https://f5b0ad54-ce3f-419b-bc0f-820c8219f4ed.mock.pstmn.io/ampeco/start',
          )
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(error);
              throw error;
            }),
          ),
      );

      // trigger event
      const chargeSessionEvent = new ChargeSessionEvent();

      chargeSessionEvent.sessionId = data.sessionId;
      chargeSessionEvent.isCharging = true;

      this.eventEmitter.emit('charging.started', chargeSessionEvent);

      return {
        sessionId: data.sessionId,
        charging: data.success,
        message: 'Charging session has started',
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  /**
   * Checks the hardware and network status of the charging point
   * @param chargePointId
   * @returns The hardwareStatus(string), the evses connected, and networkStatus(string) and the lastUpdatedAt (Date)
   */
  async chargePointStatus() {
    try {
      const { data } = await firstValueFrom(
        this.httpService
          .get(`resources/charge-points/v1.0/${this.chargePointId}/status`)
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(error);
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

  /**
   *
   * @param sessionId - the id returned by the startCharging action
   */
  async storeSessionInfo(sessionId?: string) {
    try {
      const { data, status } = await firstValueFrom(
        this.httpService
          .get(
            'https://f5b0ad54-ce3f-419b-bc0f-820c8219f4ed.mock.pstmn.io/ampeco',
          )
          .pipe(
            // this.httpService.get(`resources/sessions/v1.0/${sessionId}`).pipe(
            catchError((error: AxiosError) => {
              this.logger.error(error);
              throw error;
            }),
          ),
      );

      let resp = data.data;

      console.log(resp);

      if (status === 200) {
        await this.dbService.ampecoSession.create({
          data: {
            chargePointId: this.configService.get<string>('CHARGEPOINT_ID'),
            electricityCost: resp.electricityCost,
            energy: resp.energy,
            powerKw: resp.powerKw,
            socPercent: resp.socPercent,
            evseId: this.configService.get<string>('EVSE_ID'),
            amount: resp.amount,
            startedAt: resp.startedAt,
            stoppedAt: resp.stoppedAt,
          },
        });

        return {
          message: 'Session info stored',
          success: true,
        };
      } else {
        return {
          message: 'Error retrieving session',
          success: false,
        };
      }
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
