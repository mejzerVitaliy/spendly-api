import { Prisma, prisma } from '@/database/prisma/prisma';

const create = (
  userId: string,
  type: string,
  titleKey: string,
  bodyKey: string,
  bodyParams?: Record<string, string | number>,
) =>
  prisma.notificationLog.create({
    data: {
      userId,
      type,
      titleKey,
      bodyKey,
      bodyParams: bodyParams ?? Prisma.JsonNull,
    },
  });

const findRecentForUser = <T extends Prisma.NotificationLogFindManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.NotificationLogFindManyArgs>,
) => prisma.notificationLog.findMany(args);

export const notificationLogRepository = {
  create,
  findRecentForUser,
};
