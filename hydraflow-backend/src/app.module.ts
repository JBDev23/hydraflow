import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthGuard } from './modules/auth/auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { WaterModule } from './modules/water/water.module';
import { ShopModule } from './modules/shop/shop.module';
import { AchievementsModule } from './modules/achievements/achievements.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 15 * 60 * 1000,
        limit: process.env.NODE_ENV === 'production' ? 100 : 1000,
      },
    ]),
    PrismaModule,
    AuthModule,
    UserModule,
    WaterModule,
    ShopModule,
    AchievementsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
