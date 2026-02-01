import { Prisma, prisma } from '@/database/prisma/prisma';

const create = <T extends Prisma.CategoryCreateArgs>(
  args: Prisma.SelectSubset<T, Prisma.CategoryCreateArgs>,
) => prisma.category.create(args);

const findMany = <T extends Prisma.CategoryFindManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.CategoryFindManyArgs>,
) => prisma.category.findMany(args);

const findUnique = <T extends Prisma.CategoryFindUniqueArgs>(
  args: Prisma.SelectSubset<T, Prisma.CategoryFindUniqueArgs>,
) => prisma.category.findUnique(args);

const findFirst = <T extends Prisma.CategoryFindFirstArgs>(
  args: Prisma.SelectSubset<T, Prisma.CategoryFindFirstArgs>,
) => prisma.category.findFirst(args);

const upsert = <T extends Prisma.CategoryUpsertArgs>(
  args: Prisma.SelectSubset<T, Prisma.CategoryUpsertArgs>,
) => prisma.category.upsert(args);

const update = <T extends Prisma.CategoryUpdateArgs>(
  args: Prisma.SelectSubset<T, Prisma.CategoryUpdateArgs>,
) => prisma.category.update(args);

const deleteOne = <T extends Prisma.CategoryDeleteArgs>(
  args: Prisma.SelectSubset<T, Prisma.CategoryDeleteArgs>,
) => prisma.category.delete(args);

const findById = async (id: string) => {
  return await prisma.category.findUnique({
    where: { id },
  });
};

const findByName = async (name: string) => {
  return await prisma.category.findUnique({
    where: { name },
  });
};

const getUserFavoriteCategories = async (userId: string) => {
  return await prisma.userFavoriteCategory.findMany({
    where: { userId },
    orderBy: { order: 'asc' },
    include: { category: true },
  });
};

const countUserFavoriteCategories = async (userId: string) => {
  return await prisma.userFavoriteCategory.count({
    where: { userId },
  });
};

const addUserFavoriteCategory = async (
  userId: string,
  categoryId: string,
  order: number,
) => {
  return await prisma.userFavoriteCategory.create({
    data: {
      userId,
      categoryId,
      order,
    },
    include: { category: true },
  });
};

const removeUserFavoriteCategory = async (
  userId: string,
  categoryId: string,
) => {
  return await prisma.userFavoriteCategory.delete({
    where: {
      userId_categoryId: {
        userId,
        categoryId,
      },
    },
  });
};

const updateUserFavoriteCategories = async (
  userId: string,
  categoryIds: string[],
) => {
  await prisma.$transaction(async (tx) => {
    await tx.userFavoriteCategory.deleteMany({
      where: { userId },
    });

    if (categoryIds.length === 0) {
      return;
    }

    await tx.userFavoriteCategory.createMany({
      data: categoryIds.map((categoryId, index) => ({
        userId,
        categoryId,
        order: index,
      })),
    });
  });

  return await getUserFavoriteCategories(userId);
};

export const categoryRepository = {
  create,
  findMany,
  findUnique,
  findFirst,
  upsert,
  update,
  delete: deleteOne,
  findById,
  findByName,
  getUserFavoriteCategories,
  countUserFavoriteCategories,
  addUserFavoriteCategory,
  removeUserFavoriteCategory,
  updateUserFavoriteCategories,
};
