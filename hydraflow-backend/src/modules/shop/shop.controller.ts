import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Post } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { ItemsService } from '../items/items.service';
import { ItemActionDto } from './dto/item-action.dto';

@Controller('shop')
export class ShopController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get('catalog')
  async getItems() {
    try {
      const items = await this.itemsService.getCatalog();
      return { success: true, items };
    } catch (error) {
      console.error('Get Items Error:', error);
      throw new HttpException({ error: 'Failed to fetch items' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('buy')
  @HttpCode(HttpStatus.OK)
  async buyItem(@UserId() userId: string, @Body() body: ItemActionDto) {
    const result = await this.itemsService.buyItem(userId, body.itemId);
    return { success: true, data: result };
  }

  @Post('equip')
  @HttpCode(HttpStatus.OK)
  async equipItem(@UserId() userId: string, @Body() body: ItemActionDto) {
    const allItems = await this.itemsService.equipItem(userId, body.itemId);
    return { success: true, items: allItems };
  }
}
