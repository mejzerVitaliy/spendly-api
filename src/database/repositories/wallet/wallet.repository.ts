import { DbClient, Prisma, prisma } from '@/database/prisma/prisma';

const create = <T extends Prisma.WalletCreateArgs>(
  args: Prisma.SelectSubset<T, Prisma.WalletCreateArgs>,
  client: DbClient = prisma,
) => client.wallet.create(args);

const findMany = <T extends Prisma.WalletFindManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.WalletFindManyArgs>,
  client: DbClient = prisma,
) => client.wallet.findMany(args);

const findUnique = <T extends Prisma.WalletFindUniqueArgs>(
  args: Prisma.SelectSubset<T, Prisma.WalletFindUniqueArgs>,
  client: DbClient = prisma,
) => client.wallet.findUnique(args);

const findFirst = <T extends Prisma.WalletFindFirstArgs>(
  args: Prisma.SelectSubset<T, Prisma.WalletFindFirstArgs>,
  client: DbClient = prisma,
) => client.wallet.findFirst(args);

const update = <T extends Prisma.WalletUpdateArgs>(
  args: Prisma.SelectSubset<T, Prisma.WalletUpdateArgs>,
  client: DbClient = prisma,
) => client.wallet.update(args);

const updateMany = <T extends Prisma.WalletUpdateManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.WalletUpdateManyArgs>,
  client: DbClient = prisma,
) => client.wallet.updateMany(args);

const deleteOne = <T extends Prisma.WalletDeleteArgs>(
  args: Prisma.SelectSubset<T, Prisma.WalletDeleteArgs>,
  client: DbClient = prisma,
) => client.wallet.delete(args);

const count = <T extends Prisma.WalletCountArgs>(
  args: Prisma.SelectSubset<T, Prisma.WalletCountArgs>,
  client: DbClient = prisma,
) => client.wallet.count(args);

const aggregate = <T extends Prisma.WalletAggregateArgs>(
  args: Prisma.SelectSubset<T, Prisma.WalletAggregateArgs>,
  client: DbClient = prisma,
) => client.wallet.aggregate(args);

export const walletRepository = {
  create,
  findMany,
  findUnique,
  findFirst,
  update,
  updateMany,
  delete: deleteOne,
  count,
  aggregate,
};
