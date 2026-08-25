import { IsDateString } from 'class-validator';

export class RangeMetricsQueryDto {
  @IsDateString({ strict: true }, { message: 'startDate must be YYYY-MM-DD' })
  startDate!: string;

  @IsDateString({ strict: true }, { message: 'endDate must be YYYY-MM-DD' })
  endDate!: string;
}
