export interface RealTimeDto {
  dataItemMap: {
    active_power: number;
    reactive_power: number;
    inverter_state: number;
    efficiency: number;
    mppt_total_cap: number;
    total_cap: number;
  };
  devId: number;
  sn: string;
}
