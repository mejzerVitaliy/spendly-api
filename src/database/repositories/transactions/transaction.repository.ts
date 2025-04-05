import { Prisma, prisma } from '@/database/prisma/prisma';

const create = <T extends Prisma.TransactionCreateArgs>(
  args: Prisma.SelectSubset<T, Prisma.UserCreateArgs>
) => prisma.transaction.create(args);

const findMany = <T extends Prisma.TransactionFindManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.UserFindManyArgs>
) => prisma.transaction.findMany(args);

const findUnique = <T extends Prisma.TransactionFindUniqueArgs>(
  args: Prisma.SelectSubset<T, Prisma.UserFindUniqueArgs>
) => prisma.transaction.findUnique(args);

const findFirst = <T extends Prisma.TransactionFindFirstArgs>(
  args: Prisma.SelectSubset<T, Prisma.UserFindFirstArgs>
) => prisma.transaction.findFirst(args);

const upsert = <T extends Prisma.TransactionUpsertArgs>(
  args: Prisma.SelectSubset<T, Prisma.UserUpsertArgs>
) => prisma.transaction.upsert(args);

const update = <T extends Prisma.TransactionUpdateArgs>(
  args: Prisma.SelectSubset<T, Prisma.UserUpdateArgs>
) => prisma.transaction.update(args);

const deleteOne = <T extends Prisma.TransactionDeleteArgs>(
  args: Prisma.SelectSubset<T, Prisma.UserDeleteArgs>
) => prisma.transaction.delete(args);

export const transactionRepository = {
  create,
  findMany,
  findUnique,
  findFirst,
  upsert,
  update,
  delete: deleteOne,
};