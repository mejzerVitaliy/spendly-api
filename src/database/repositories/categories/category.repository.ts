import { Prisma, prisma } from '@/database/prisma/prisma';

const create = <T extends Prisma.CategoryCreateArgs>(
  args: Prisma.SelectSubset<T, Prisma.UserCreateArgs>
) => prisma.category.create(args);

const findMany = <T extends Prisma.CategoryFindManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.UserFindManyArgs>
) => prisma.category.findMany(args);

const findUnique = <T extends Prisma.CategoryFindUniqueArgs>(
  args: Prisma.SelectSubset<T, Prisma.UserFindUniqueArgs>
) => prisma.category.findUnique(args);

const findFirst = <T extends Prisma.CategoryFindFirstArgs>(
  args: Prisma.SelectSubset<T, Prisma.UserFindFirstArgs>
) => prisma.category.findFirst(args);

const upsert = <T extends Prisma.CategoryUpsertArgs>(
  args: Prisma.SelectSubset<T, Prisma.UserUpsertArgs>
) => prisma.category.upsert(args);

const update = <T extends Prisma.CategoryUpdateArgs>(
  args: Prisma.SelectSubset<T, Prisma.UserUpdateArgs>
) => prisma.category.update(args);

const deleteOne = <T extends Prisma.CategoryDeleteArgs>(
  args: Prisma.SelectSubset<T, Prisma.UserDeleteArgs>
) => prisma.category.delete(args);

export const categoryRepository = {
  create,
  findMany,
  findUnique,
  findFirst,
  upsert,
  update,
  delete: deleteOne,
};