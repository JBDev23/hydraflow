import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { MAX_LOG_AMOUNT_ML } from '../water.service';

export class LogWaterDto {
  @Type(() => Number)
  @IsInt({ message: `Valid amount is required (1–${MAX_LOG_AMOUNT_ML} ml, integer)` })
  @Min(1, { message: `Valid amount is required (1–${MAX_LOG_AMOUNT_ML} ml, integer)` })
  @Max(MAX_LOG_AMOUNT_ML, {
    message: `Valid amount is required (1–${MAX_LOG_AMOUNT_ML} ml, integer)`,
  })
  amount!: number;
}
