import { IsEmail, IsIn, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class SocialLoginDto {
  @IsIn(['google', 'test'])
  provider!: string;

  /** Google ID token — required when provider is google */
  @ValidateIf((o: SocialLoginDto) => o.provider === 'google')
  @IsString()
  @MaxLength(4096)
  token?: string;

  /** Required when provider is test */
  @ValidateIf((o: SocialLoginDto) => o.provider === 'test')
  @IsEmail()
  @MaxLength(320)
  manualEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  manualName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  deviceLanguage?: string;
}
