import { prisma } from '@/database/prisma/prisma';

const findAllForUser = (userId: string) =>
  prisma.notificationCooldown.findMany({ where: { userId } });

const record = (userId: string, type: string, at: Date) =>
  prisma.notificationCooldown.upsert({
    where: { userId_type: { userId, type } },
    create: { userId, type, lastSentAt: at },
    update: { lastSentAt: at },
  });

export const notificationCooldownRepository = {
  findAllForUser,
  record,
};
