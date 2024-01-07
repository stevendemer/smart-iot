import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChargeSessionEvent } from './charge-session.event';
import { AmpecoService } from '../ampeco/ampeco.service';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class ChargeListener {
  private isCharging: boolean = false; // used for cron job

  constructor(
    private ampecoService: AmpecoService,
    private scheduler: SchedulerRegistry,
  ) {}

  @OnEvent('charging.started')
  async handleChargingSession(event: ChargeSessionEvent) {
    // charging has started, store on an hourly basis the session info
    // from ampeco
    if (event.isCharging) {
      this.isCharging = true;
      // start the cron job
      await this.runJob();
    }
  }

  @OnEvent('charging.stopped')
  async handleStopCharging() {
    if (this.isCharging) {
      this.isCharging = false;
      const job = this.scheduler.getCronJob('ampeco');
      if (job.running) {
        job.stop();
        console.log('Stopped');
      }
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS, { name: 'ampeco' })
  async runJob() {
    if (this.isCharging) {
      // console.log(isCharging);
      console.log('Inside cron job');
      await this.ampecoService.storeSessionInfo();
    }
  }
}
