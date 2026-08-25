import { Controller, Get } from '@nestjs/common';
import { Public } from './modules/common/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  health() {
    return { status: 'HydraFlow API is running 💧' };
  }
}
