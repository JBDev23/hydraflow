import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { itemsService } from '../modules/items/items.service';
import { DomainError } from '../modules/common/domain-error';

export const getItems = async (req: AuthRequest, res: Response) => {
  try {
    const items = await itemsService.getCatalog();
    return res.json({ success: true, items });
  } catch (error) {
    console.error('Get Items Error:', error);
    return res.status(500).json({ error: 'Failed to fetch items' });
  }
};

export const buyItem = async (req: AuthRequest, res: Response) => {
  try {
    const result = await itemsService.buyItem(req.userId!, req.body.itemId);
    return res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof DomainError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Buy Item Error:', error);
    return res.status(500).json({ error: 'Error al comprar item' });
  }
};

export const equipItem = async (req: AuthRequest, res: Response) => {
  try {
    const allItems = await itemsService.equipItem(req.userId!, req.body.itemId);
    return res.json({ success: true, items: allItems });
  } catch (error) {
    if (error instanceof DomainError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Equip Item Error:', error);
    return res.status(500).json({ error: 'Error al equipar item' });
  }
};
