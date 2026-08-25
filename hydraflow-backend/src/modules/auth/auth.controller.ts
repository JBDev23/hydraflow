import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Public } from '../common/public.decorator';
import { AuthService } from './auth.service';
import { SocialLoginDto } from './dto/social-login.dto';

const isProd = process.env.NODE_ENV === 'production';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({
    default: {
      limit: isProd ? 100 : 1000,
      ttl: 15 * 60 * 1000,
    },
  })
  async socialLogin(@Body() body: SocialLoginDto) {
    const result = await this.authService.socialLogin(body);
    return {
      success: true,
      token: result.token,
      user: result.user,
    };
  }
}
