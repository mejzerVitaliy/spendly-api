import { DbClient, Prisma, prisma } from '@/database/prisma/prisma';

const create = <T extends Prisma.DailyBalanceSnapshotCreateArgs>(
  args: Prisma.SelectSubset<T, Prisma.DailyBalanceSnapshotCreateArgs>,
  client: DbClient = prisma,
) => client.dailyBalanceSnapshot.create(args);

const findMany = <T extends Prisma.DailyBalanceSnapshotFindManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.DailyBalanceSnapshotFindManyArgs>,
  client: DbClient = prisma,
) => client.dailyBalanceSnapshot.findMany(args);

const findUnique = <T extends Prisma.DailyBalanceSnapshotFindUniqueArgs>(
  args: Prisma.SelectSubset<T, Prisma.DailyBalanceSnapshotFindUniqueArgs>,
  client: DbClient = prisma,
) => client.dailyBalanceSnapshot.findUnique(args);

const findFirst = <T extends Prisma.DailyBalanceSnapshotFindFirstArgs>(
  args: Prisma.SelectSubset<T, Prisma.DailyBalanceSnapshotFindFirstArgs>,
  client: DbClient = prisma,
) => client.dailyBalanceSnapshot.findFirst(args);

const upsert = <T extends Prisma.DailyBalanceSnapshotUpsertArgs>(
  args: Prisma.SelectSubset<T, Prisma.DailyBalanceSnapshotUpsertArgs>,
  client: DbClient = prisma,
) => client.dailyBalanceSnapshot.upsert(args);

const update = <T extends Prisma.DailyBalanceSnapshotUpdateArgs>(
  args: Prisma.SelectSubset<T, Prisma.DailyBalanceSnapshotUpdateArgs>,
  client: DbClient = prisma,
) => client.dailyBalanceSnapshot.update(args);

const deleteOne = <T extends Prisma.DailyBalanceSnapshotDeleteArgs>(
  args: Prisma.SelectSubset<T, Prisma.DailyBalanceSnapshotDeleteArgs>,
  client: DbClient = prisma,
) => client.dailyBalanceSnapshot.delete(args);

const deleteMany = <T extends Prisma.DailyBalanceSnapshotDeleteManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.DailyBalanceSnapshotDeleteManyArgs>,
  client: DbClient = prisma,
) => client.dailyBalanceSnapshot.deleteMany(args);

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
