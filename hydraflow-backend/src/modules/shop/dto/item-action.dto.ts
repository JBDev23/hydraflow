import { IsString, MaxLength, MinLength } from 'class-validator';

export class ItemActionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  itemId!: string;
}
