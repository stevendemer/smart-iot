import { Injectable } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { AmpecoService } from 'src/ampeco/ampeco.service';
import { DbService } from 'src/db/db.service';
import { ChargeSessionEvent } from '../notifications/charge-session.event';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class NotificationsService {
  private runCron = false;

  constructor(
    private readonly ampecoService: AmpecoService,
    private readonly dbService: DbService,
    private scheduler: SchedulerRegistry,
  ) {}

  //   @OnEvent('charging.started')
  @Cron(CronExpression.EVERY_10_SECONDS, { name: 'ampeco' })
  async storeSession() {
    // store the data in the database
    // const {
    //   amount,
    //   energy,
    //   powerKw,
    //   socPercent,
    //   sessionId,
    //   electricityCost,
    //   startedAt,
    //   stoppedAt,
    //   evseId,
    //   chargePointId,
    // } = event.payload;

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

    if (this.runCron) {
      await this.ampecoService.readSessionInfo();

      console.log('Inside session cron job');
    }

    // console.log('Session info stored');
  }

  @OnEvent('charging.stopped')
  async stopStoring() {
    if (this.runCron) {
      this.runCron = false;
      const job = this.scheduler.getCronJob('ampeco');
      if (job.running) {
        job.stop();
        console.log('Ampeco job stopped');
      }
    }
  }

  @OnEvent('charging.started')
  async runCronJob() {
    this.runCron = true;
    await this.storeSession();
  }
}
