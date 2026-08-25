import { IsDateString, IsIn } from 'class-validator';

export class StatsGraphQueryDto {
  @IsIn(['day', 'week', 'month'], { message: "mode must be 'day', 'week' or 'month'" })
  mode!: string;

  @IsDateString({ strict: true }, { message: 'refDate must be YYYY-MM-DD' })
  refDate!: string;
}
