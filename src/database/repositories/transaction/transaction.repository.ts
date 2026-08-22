import { DbClient, Prisma, prisma } from '@/database/prisma/prisma';

const create = <T extends Prisma.TransactionCreateArgs>(
  args: Prisma.SelectSubset<T, Prisma.TransactionCreateArgs>,
  client: DbClient = prisma,
) => client.transaction.create(args);

const findMany = <T extends Prisma.TransactionFindManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.TransactionFindManyArgs>,
  client: DbClient = prisma,
) => client.transaction.findMany(args);

const findUnique = <T extends Prisma.TransactionFindUniqueArgs>(
  args: Prisma.SelectSubset<T, Prisma.TransactionFindUniqueArgs>,
  client: DbClient = prisma,
) => client.transaction.findUnique(args);

const findFirst = <T extends Prisma.TransactionFindFirstArgs>(
  args: Prisma.SelectSubset<T, Prisma.TransactionFindFirstArgs>,
  client: DbClient = prisma,
) => client.transaction.findFirst(args);

const upsert = <T extends Prisma.TransactionUpsertArgs>(
  args: Prisma.SelectSubset<T, Prisma.TransactionUpsertArgs>,
  client: DbClient = prisma,
) => client.transaction.upsert(args);

const update = <T extends Prisma.TransactionUpdateArgs>(
  args: Prisma.SelectSubset<T, Prisma.TransactionUpdateArgs>,
  client: DbClient = prisma,
) => client.transaction.update(args);

const deleteOne = <T extends Prisma.TransactionDeleteArgs>(
  args: Prisma.SelectSubset<T, Prisma.TransactionDeleteArgs>,
  client: DbClient = prisma,
) => client.transaction.delete(args);

export const transactionRepository = {
  create,
  findMany,
  findUnique,
  findFirst,
  upsert,
  update,
  delete: deleteOne,
};
