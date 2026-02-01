import { TransactionType } from '@prisma/client';
import { z } from 'zod';
import { createResponseWithDataSchema } from '../application';

export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  color: z.string(),
  type: z.nativeEnum(TransactionType),
  order: z.number(),
});

export const getAllCategoriesResponseSchema = createResponseWithDataSchema(
  z.array(categorySchema),
);

export const favoriteCategorySchema = z.object({
  categoryId: z.string().uuid(),
  order: z.number(),
  category: categorySchema,
});

export const getUserFavoriteCategoriesResponseSchema =
  createResponseWithDataSchema(z.array(favoriteCategorySchema));

export const addUserFavoriteCategoryBodySchema = z.object({
  categoryId: z.string().uuid(),
});

type AddUserFavoriteCategoryInput = z.infer<
  typeof addUserFavoriteCategoryBodySchema
>;

export const addUserFavoriteCategoryResponseSchema =
  createResponseWithDataSchema(favoriteCategorySchema);

export const removeUserFavoriteCategoryParamsSchema = z.object({
  categoryId: z.string().uuid(),
});

type RemoveUserFavoriteCategoryParams = z.infer<
  typeof removeUserFavoriteCategoryParamsSchema
>;

export const updateUserFavoriteCategoriesBodySchema = z.object({
  categoryIds: z.array(z.string().uuid()).max(10),
});

type UpdateUserFavoriteCategoriesInput = z.infer<
  typeof updateUserFavoriteCategoriesBodySchema
>;

export const updateUserFavoriteCategoriesResponseSchema =
  createResponseWithDataSchema(z.array(favoriteCategorySchema));

export type {
  AddUserFavoriteCategoryInput,
  RemoveUserFavoriteCategoryParams,
  UpdateUserFavoriteCategoriesInput,
};
