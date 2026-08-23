import { prisma } from '../../prisma/prisma';
import { DomainError } from '../common/domain-error';

export class ItemsService {
  async getCatalog() {
    return prisma.catalogItem.findMany();
  }

  async buyItem(userId: string, itemId: string) {
    const item = await prisma.catalogItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new DomainError('ITEM_NOT_FOUND', 'Item no encontrado', 404);
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const alreadyOwned = await tx.userItem.findFirst({
          where: { userId, itemId },
        });

        if (alreadyOwned) {
          throw new DomainError('ALREADY_OWNED', 'Ya tienes este item', 400);
        }

        const stats = await tx.gameStats.findUnique({ where: { userId } });
        if (!stats || stats.dropsBalance < item.price) {
          throw new DomainError('INSUFFICIENT_FUNDS', 'No tienes suficientes drops', 400);
        }

        await tx.gameStats.update({
          where: { userId },
          data: {
            dropsBalance: { decrement: item.price },
            skinsCount: { increment: 1 },
          },
        });

        await tx.userItem.create({
          data: {
            userId,
            itemId,
            isEquipped: false,
          },
        });

        const updatedItems = await tx.userItem.findMany({ where: { userId } });
        const updatedStats = await tx.gameStats.findUnique({ where: { userId } });

        return {
          items: updatedItems,
          dropsBalance: updatedStats?.dropsBalance,
          skinsCount: updatedStats?.skinsCount,
        };
      });
    } catch (error) {
      if (error instanceof DomainError) throw error;
      throw error;
    }
  }

  async equipItem(userId: string, itemId: string) {
    const userItem = await prisma.userItem.findFirst({
      where: { userId, itemId },
      include: { item: true },
    });

    if (!userItem) {
      throw new DomainError('ITEM_NOT_OWNED', 'No posees este item', 403);
    }

    const category = userItem.item.category;
    const isCurrentlyEquipped = userItem.isEquipped;

    await prisma.$transaction(async (tx) => {
      if (isCurrentlyEquipped) {
        await tx.userItem.update({
          where: { id: userItem.id },
          data: { isEquipped: false },
        });
      } else {
        const itemsToUnequip = await tx.userItem.findMany({
          where: {
            userId,
            isEquipped: true,
            item: { category },
          },
        });

        for (const i of itemsToUnequip) {
          await tx.userItem.update({
            where: { id: i.id },
            data: { isEquipped: false },
          });
        }

        await tx.userItem.update({
          where: { id: userItem.id },
          data: { isEquipped: true },
        });
      }
    });

    return prisma.userItem.findMany({ where: { userId } });
  }
}

export const itemsService = new ItemsService();
