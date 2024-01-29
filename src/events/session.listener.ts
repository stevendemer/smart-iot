import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChargeSessionEvent } from '../notifications/charge-session.event';
import { AmpecoService } from '../ampeco/ampeco.service';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class SessionListener {
  private isCharging: boolean = false;

  constructor(
    private ampecoService: AmpecoService,
    private scheduler: SchedulerRegistry,
  ) {}
}
