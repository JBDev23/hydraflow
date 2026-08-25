import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { WaterController } from './water.controller';
import { WaterService } from './water.service';

@Module({
  imports: [UserModule],
  controllers: [WaterController],
  providers: [WaterService],
  exports: [WaterService],
})
export class WaterModule {}
