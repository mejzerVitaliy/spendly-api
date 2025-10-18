import { Prisma, prisma } from '@/database/prisma/prisma';

const create = <T extends Prisma.DailyBalanceSnapshotCreateArgs>(
  args: Prisma.SelectSubset<T, Prisma.DailyBalanceSnapshotCreateArgs>,
) => prisma.dailyBalanceSnapshot.create(args);

const findMany = <T extends Prisma.DailyBalanceSnapshotFindManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.DailyBalanceSnapshotFindManyArgs>,
) => prisma.dailyBalanceSnapshot.findMany(args);

const findUnique = <T extends Prisma.DailyBalanceSnapshotFindUniqueArgs>(
  args: Prisma.SelectSubset<T, Prisma.DailyBalanceSnapshotFindUniqueArgs>,
) => prisma.dailyBalanceSnapshot.findUnique(args);

const findFirst = <T extends Prisma.DailyBalanceSnapshotFindFirstArgs>(
  args: Prisma.SelectSubset<T, Prisma.DailyBalanceSnapshotFindFirstArgs>,
) => prisma.dailyBalanceSnapshot.findFirst(args);

const upsert = <T extends Prisma.DailyBalanceSnapshotUpsertArgs>(
  args: Prisma.SelectSubset<T, Prisma.DailyBalanceSnapshotUpsertArgs>,
) => prisma.dailyBalanceSnapshot.upsert(args);

const update = <T extends Prisma.DailyBalanceSnapshotUpdateArgs>(
  args: Prisma.SelectSubset<T, Prisma.DailyBalanceSnapshotUpdateArgs>,
) => prisma.dailyBalanceSnapshot.update(args);

const deleteOne = <T extends Prisma.DailyBalanceSnapshotDeleteArgs>(
  args: Prisma.SelectSubset<T, Prisma.DailyBalanceSnapshotDeleteArgs>,
) => prisma.dailyBalanceSnapshot.delete(args);

const deleteMany = <T extends Prisma.DailyBalanceSnapshotDeleteManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.DailyBalanceSnapshotDeleteManyArgs>,
) => prisma.dailyBalanceSnapshot.deleteMany(args);

export const dailySnapshotRepository = {
  create,
  findMany,
  findUnique,
  findFirst,
  upsert,
  update,
  delete: deleteOne,
  deleteMany,
};
