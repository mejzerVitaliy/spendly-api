import { BadRequestError, NotFoundError } from '@/business/lib';
import { categoryRepository } from '@/database/repositories';

const getAllCategories = async () => {
  return await categoryRepository.findMany({
    orderBy: { order: 'asc' },
  });
};

const getCategoryById = async (id: string) => {
  const category = await categoryRepository.findById(id);

  if (!category) {
    throw new NotFoundError(`Category not found`);
  }
  return category;
};

const getUserFavoriteCategories = async (userId: string) => {
  return await categoryRepository.getUserFavoriteCategories(userId);
};

const addUserFavoriteCategory = async (userId: string, categoryId: string) => {
  const category = await categoryRepository.findById(categoryId);
  if (!category) {
    throw new BadRequestError(`Category not found`);
  }

  const count = await categoryRepository.countUserFavoriteCategories(userId);
  if (count >= 10) {
    throw new BadRequestError('Maximum 10 favorite categories allowed');
  }

  return await categoryRepository.addUserFavoriteCategory(
    userId,
    categoryId,
    count,
  );
};

const removeUserFavoriteCategory = async (
  userId: string,
  categoryId: string,
) => {
  return await categoryRepository.removeUserFavoriteCategory(
    userId,
    categoryId,
  );
};

const updateUserFavoriteCategories = async (
  userId: string,
  categoryIds: string[],
) => {
  if (categoryIds.length > 10) {
    throw new BadRequestError('Maximum 10 favorite categories allowed');
  }

  for (const id of categoryIds) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new BadRequestError(`Category not found`);
    }
  }

  return await categoryRepository.updateUserFavoriteCategories(
    userId,
    categoryIds,
  );
};

export const categoryService = {
  getAllCategories,
  getCategoryById,
  getUserFavoriteCategories,
  addUserFavoriteCategory,
  removeUserFavoriteCategory,
  updateUserFavoriteCategories,
};
