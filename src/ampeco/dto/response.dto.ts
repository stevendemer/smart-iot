export interface ApiResponse {
  id: string;
  chargePointId: string;
  evseId: string;
  status: string;
  userId: string;
  startedAt: string;
  stoppedAt: string;
  socPercent: number;
  amount: number;
  powerKw: number;
  energy: number;
  electricityCost: number;
}
