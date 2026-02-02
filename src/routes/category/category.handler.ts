import { categoryService } from '@/business/services/category';
import { FastifyReply, FastifyRequest } from 'fastify';
import { JwtPayload } from 'jsonwebtoken';
import {
  AddUserFavoriteCategoryInput,
  RemoveUserFavoriteCategoryParams,
  UpdateUserFavoriteCategoriesInput,
} from '@/business';

const getAllCategories = async (req: FastifyRequest, reply: FastifyReply) => {
  const categories = await categoryService.getAllCategories();

  const response = {
    message: 'Categories retrieved successfully',
    data: categories,
  };

  reply.send(response);
};

const getUserFavoriteCategories = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;

  const favoriteCategories =
    await categoryService.getUserFavoriteCategories(userId);

  const response = {
    message: 'Favorite categories retrieved successfully',
    data: favoriteCategories,
  };

  reply.send(response);
};

const addUserFavoriteCategory = async (
  req: FastifyRequest<{
    Body: AddUserFavoriteCategoryInput;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { categoryId } = req.body;

  const favoriteCategory = await categoryService.addUserFavoriteCategory(
    userId,
    categoryId,
  );

  const response = {
    message: 'Favorite category added successfully',
    data: favoriteCategory,
  };

  reply.send(response);
};

const removeUserFavoriteCategory = async (
  req: FastifyRequest<{
    Params: RemoveUserFavoriteCategoryParams;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { categoryId } = req.params;

  await categoryService.removeUserFavoriteCategory(userId, categoryId);

  const response = {
    message: 'Favorite category removed successfully',
  };

  reply.send(response);
};

const updateUserFavoriteCategories = async (
  req: FastifyRequest<{
    Body: UpdateUserFavoriteCategoriesInput;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { categoryIds } = req.body;

  const favoriteCategories = await categoryService.updateUserFavoriteCategories(
    userId,
    categoryIds,
  );

  const response = {
    message: 'Favorite categories updated successfully',
    data: favoriteCategories,
  };

  reply.send(response);
};

export const categoryHandler = {
  getAllCategories,
  getUserFavoriteCategories,
  addUserFavoriteCategory,
  removeUserFavoriteCategory,
  updateUserFavoriteCategories,
};
