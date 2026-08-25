import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpdateGameStatsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  dropsBalance?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  currentStreak?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  level?: number;
}

/** Matches frontend TimeOfDay and Prisma Json settings.wakeTime / sleepTime. */
export class TimeOfDayDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(23)
  hours!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(59)
  minutes!: number;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  weight?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(300)
  height?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  activity?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(20_000)
  goal?: number;

  @IsOptional()
  @IsObject()
  notifications?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  preferences?: Record<string, unknown>;

  @IsOptional()
  @ValidateNested()
  @Type(() => TimeOfDayDto)
  wakeTime?: TimeOfDayDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TimeOfDayDto)
  sleepTime?: TimeOfDayDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateGameStatsDto)
  stats?: UpdateGameStatsDto;
}
