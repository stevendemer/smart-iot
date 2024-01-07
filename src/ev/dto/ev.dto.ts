import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class EVDto {
  // %
  @ApiProperty({
    description: 'Current charge level of EV',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  currentChargeLevel: number;

  // hours
  @ApiProperty({
    description: 'Duration of stay',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  durationStay: number;

  // %
  @ApiProperty({
    description: 'Minimum charge level of the EV',
  })
  @IsNumber()
  @Min(1)
  minChargeLevel: number;

  // kwh
  @ApiProperty({
    description: 'Car battery capacity',
  })
  @IsNumber()
  carBatteryCapacity: number;
}
