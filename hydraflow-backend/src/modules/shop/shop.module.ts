import { Module } from '@nestjs/common';
import { ItemsService } from '../items/items.service';
import { ShopController } from './shop.controller';

@Module({
  controllers: [ShopController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ShopModule {}
