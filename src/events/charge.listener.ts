import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChargeSessionEvent } from './charge-session.event';
import { AmpecoService } from '../ampeco/ampeco.service';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class ChargeListener {
  private isCharging: boolean = false;

  constructor(
    private ampecoService: AmpecoService,
    private scheduler: SchedulerRegistry,
  ) {}

  @OnEvent('charging.started')
  async handleChargingSession(event: ChargeSessionEvent) {
    // charging has started, store on an hourly basis the session info
    // from ampeco

    console.log('Inside listener: charging ', event);
    if (event.isCharging) {
      this.isCharging = true;
      // start the cron job
      await this.runJob();
    }
    // if (event.isCharging) {
    //   console.log('Running cron job');
    // } else {
    //   console.log('Not charging...');
    // }
  }

  @OnEvent('charging.stopped')
  async handleStopCharging() {
    if (this.isCharging) {
      this.isCharging = false;
      const job = this.scheduler.getCronJob('session');
      if (job.running) {
        job.stop();
        console.log('Stopped');
      }
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS, { name: 'session' })
  async runJob() {
    if (this.isCharging) {
      // console.log(isCharging);
      console.log('Inside cron job');
      await this.ampecoService.storeSessionInfo();
    }
  }
}
