import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function createNotification(
  data: { userId: string; title: string; message: string },
  tx?: Prisma.TransactionClient
) {
  const client = tx || prisma;
  return client.notification.create({
    data,
  });
}
