import { Prisma, prisma } from '@/database/prisma/prisma';

const create = <T extends Prisma.CurrencyCreateArgs>(
  args: Prisma.SelectSubset<T, Prisma.CurrencyCreateArgs>,
) => prisma.currency.create(args);

const findMany = <T extends Prisma.CurrencyFindManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.CurrencyFindManyArgs>,
) => prisma.currency.findMany(args);

const findUnique = <T extends Prisma.CurrencyFindUniqueArgs>(
  args: Prisma.SelectSubset<T, Prisma.CurrencyFindUniqueArgs>,
) => prisma.currency.findUnique(args);

const findFirst = <T extends Prisma.CurrencyFindFirstArgs>(
  args: Prisma.SelectSubset<T, Prisma.CurrencyFindFirstArgs>,
) => prisma.currency.findFirst(args);

const upsert = <T extends Prisma.CurrencyUpsertArgs>(
  args: Prisma.SelectSubset<T, Prisma.CurrencyUpsertArgs>,
) => prisma.currency.upsert(args);

const update = <T extends Prisma.CurrencyUpdateArgs>(
  args: Prisma.SelectSubset<T, Prisma.CurrencyUpdateArgs>,
) => prisma.currency.update(args);

const deleteOne = <T extends Prisma.CurrencyDeleteArgs>(
  args: Prisma.SelectSubset<T, Prisma.CurrencyDeleteArgs>,
) => prisma.currency.delete(args);

const findByCode = async (code: string) => {
  return await prisma.currency.findUnique({
    where: { code },
  });
};

const getUserFavoriteCurrencies = async (userId: string) => {
  return await prisma.userFavoriteCurrency.findMany({
    where: { userId },
    orderBy: { order: 'asc' },
    include: { currency: true },
  });
};

const countUserFavoriteCurrencies = async (userId: string) => {
  return await prisma.userFavoriteCurrency.count({
    where: { userId },
  });
};

const addUserFavoriteCurrency = async (
  userId: string,
  currencyCode: string,
  order: number,
) => {
  return await prisma.userFavoriteCurrency.create({
    data: {
      userId,
      currencyCode,
      order,
    },
    include: { currency: true },
  });
};

const removeUserFavoriteCurrency = async (
  userId: string,
  currencyCode: string,
) => {
  return await prisma.userFavoriteCurrency.delete({
    where: {
      userId_currencyCode: {
        userId,
        currencyCode,
      },
    },
  });
};

const updateUserFavoriteCurrencies = async (
  userId: string,
  currencyCodes: string[],
) => {
  await prisma.$transaction(async (tx) => {
    await tx.userFavoriteCurrency.deleteMany({
      where: { userId },
    });

    if (currencyCodes.length === 0) {
      return;
    }

    await tx.userFavoriteCurrency.createMany({
      data: currencyCodes.map((currencyCode, index) => ({
        userId,
        currencyCode,
        order: index,
      })),
    });
  });

  return await getUserFavoriteCurrencies(userId);
};

export const currencyRepository = {
  create,
  findMany,
  findUnique,
  findFirst,
  upsert,
  update,
  delete: deleteOne,
  findByCode,
  getUserFavoriteCurrencies,
  countUserFavoriteCurrencies,
  addUserFavoriteCurrency,
  removeUserFavoriteCurrency,
  updateUserFavoriteCurrencies,
};
