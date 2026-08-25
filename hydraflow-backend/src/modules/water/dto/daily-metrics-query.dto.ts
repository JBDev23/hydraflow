import { IsDateString, IsOptional } from 'class-validator';

export class DailyMetricsQueryDto {
  @IsOptional()
  @IsDateString({ strict: true }, { message: 'date must be YYYY-MM-DD' })
  date?: string;
}
