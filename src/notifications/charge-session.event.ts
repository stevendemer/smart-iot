export class ChargeSessionEvent {
  constructor(
    public isCharging: boolean,
    public payload: {
      energy: number;
      powerKw: number;
      amount: number;
      sessionId: number;
      startedAt: string;
      chargePointId: number;
      evseId: number;
      electricityCost?: number | null;
      socPercent?: number | null;
      stoppedAt?: string | null;
    } = {
      energy: 0,
      powerKw: 0,
      amount: 0,
      chargePointId: 0,
      sessionId: 0,
      evseId: 0,
      startedAt: '',
      electricityCost: null,
      socPercent: null,
      stoppedAt: null,
    },
  ) {}
}
