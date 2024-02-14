import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AmpecoService } from 'src/ampeco/ampeco.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ChargeSessionEvent } from './charge-session.event';

/**
 * Handles scheduling logic related to the session storing functionality
 * Whenever the API retrieves the POST request from the form (MMS) an event is triggered
 * called 'charging.started', if no active charging session is found from the Ampeco response (user has not plugged his EV)
 * the service retries for 3 times in the span of 15 minutes when it finally stops the cron job.
 */
@Injectable()
export class NotificationsService {
  private runCron = false;
  private retries = 0;
  private readonly maxRetries = 3;

  constructor(
    private readonly ampecoService: AmpecoService,
    private scheduler: SchedulerRegistry,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS, { name: 'ampeco' })
  async storeSession(payload?: ChargeSessionEvent) {
    if (this.runCron) {
      const res = await this.ampecoService.readSessionInfo();

      if (res === false) {
        await this.handleRetries();
      }
    }
  }

  async handleRetries() {
    const delaySeconds = 5 * 60; // 5 minutes delay

    if (this.retries < this.maxRetries && this.runCron) {
      console.log(`${this.retries} retry`);
      this.retries++;

      await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));

      // retry for an active session
      await this.storeSession();
    } else {
      console.log('Stopping cron job...');
      this.stopStoring();
    }
  }

  @OnEvent('charging.stopped')
  async stopStoring() {
    this.runCron = false;
    this.retries = 0;
    const job = this.scheduler.getCronJob('ampeco');
    if (job.running) {
      job.stop();
      console.log('Session job stopped');
    }
  }

  @OnEvent('charging.started')
  async runCronJob() {
    this.runCron = true;
    await this.storeSession();
  }
}
