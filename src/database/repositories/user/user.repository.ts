import { DbClient, Prisma, prisma } from '@/database/prisma/prisma';

const create = <T extends Prisma.UserCreateArgs>(
  args: Prisma.SelectSubset<T, Prisma.UserCreateArgs>,
  client: DbClient = prisma,
) => client.user.create(args);

const findMany = <T extends Prisma.UserFindManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.UserFindManyArgs>,
  client: DbClient = prisma,
) => client.user.findMany(args);

const findUnique = <T extends Prisma.UserFindUniqueArgs>(
  args: Prisma.SelectSubset<T, Prisma.UserFindUniqueArgs>,
  client: DbClient = prisma,
) => client.user.findUnique(args);

const findFirst = <T extends Prisma.UserFindFirstArgs>(
  args: Prisma.SelectSubset<T, Prisma.UserFindFirstArgs>,
  client: DbClient = prisma,
) => client.user.findFirst(args);

const upsert = <T extends Prisma.UserUpsertArgs>(
  args: Prisma.SelectSubset<T, Prisma.UserUpsertArgs>,
  client: DbClient = prisma,
) => client.user.upsert(args);

const update = <T extends Prisma.UserUpdateArgs>(
  args: Prisma.SelectSubset<T, Prisma.UserUpdateArgs>,
  client: DbClient = prisma,
) => client.user.update(args);

const deleteOne = <T extends Prisma.UserDeleteArgs>(
  args: Prisma.SelectSubset<T, Prisma.UserDeleteArgs>,
  client: DbClient = prisma,
) => client.user.delete(args);

export const userRepository = {
  create,
  findMany,
  findUnique,
  findFirst,
  upsert,
  update,
  delete: deleteOne,
};
