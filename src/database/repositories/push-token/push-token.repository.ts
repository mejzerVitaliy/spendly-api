import { Prisma, prisma } from '@/database/prisma/prisma';

const upsertForUser = (userId: string, token: string) =>
  prisma.pushToken.upsert({
    where: { token },
    create: { userId, token },
    // A token can migrate to a different user (device handed down/reinstall
    // under a new account) - re-point it rather than erroring on the
    // unique(token) constraint.
    update: { userId },
  });

const deleteByToken = (userId: string, token: string) =>
  prisma.pushToken.deleteMany({ where: { token, userId } });

const findMany = <T extends Prisma.PushTokenFindManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.PushTokenFindManyArgs>,
) => prisma.pushToken.findMany(args);

const findDistinctUserIds = async (): Promise<string[]> => {
  const rows = await prisma.pushToken.findMany({
    select: { userId: true },
    distinct: ['userId'],
  });
  return rows.map((r) => r.userId);
};

export const pushTokenRepository = {
  upsertForUser,
  deleteByToken,
  findMany,
  findDistinctUserIds,
};
