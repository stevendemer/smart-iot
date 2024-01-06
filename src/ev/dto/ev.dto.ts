import { IsNumber, Min } from 'class-validator';

export class EVDto {
  // %
  @IsNumber()
  @Min(0)
  currentChargeLevel: number;

  // hours
  @IsNumber()
  @Min(1)
  durationStay: number;

  // %
  @IsNumber()
  @Min(1)
  minChargeLevel: number;

  // kwh
  @IsNumber()
  @Min(0)
  carBatteryCapacity: number;
}
