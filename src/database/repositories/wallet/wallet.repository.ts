import { Prisma, prisma } from '@/database/prisma/prisma';

const create = <T extends Prisma.WalletCreateArgs>(
  args: Prisma.SelectSubset<T, Prisma.WalletCreateArgs>,
) => prisma.wallet.create(args);

const findMany = <T extends Prisma.WalletFindManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.WalletFindManyArgs>,
) => prisma.wallet.findMany(args);

const findUnique = <T extends Prisma.WalletFindUniqueArgs>(
  args: Prisma.SelectSubset<T, Prisma.WalletFindUniqueArgs>,
) => prisma.wallet.findUnique(args);

const findFirst = <T extends Prisma.WalletFindFirstArgs>(
  args: Prisma.SelectSubset<T, Prisma.WalletFindFirstArgs>,
) => prisma.wallet.findFirst(args);

const update = <T extends Prisma.WalletUpdateArgs>(
  args: Prisma.SelectSubset<T, Prisma.WalletUpdateArgs>,
) => prisma.wallet.update(args);

const updateMany = <T extends Prisma.WalletUpdateManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.WalletUpdateManyArgs>,
) => prisma.wallet.updateMany(args);

const deleteOne = <T extends Prisma.WalletDeleteArgs>(
  args: Prisma.SelectSubset<T, Prisma.WalletDeleteArgs>,
) => prisma.wallet.delete(args);

const count = <T extends Prisma.WalletCountArgs>(
  args: Prisma.SelectSubset<T, Prisma.WalletCountArgs>,
) => prisma.wallet.count(args);

const aggregate = <T extends Prisma.WalletAggregateArgs>(
  args: Prisma.SelectSubset<T, Prisma.WalletAggregateArgs>,
) => prisma.wallet.aggregate(args);

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
