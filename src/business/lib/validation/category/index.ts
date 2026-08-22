import { TransactionType } from '@prisma/client';
import { z } from 'zod';
import { createResponseWithDataSchema } from '../application';

export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  nameRu: z.string().nullable().optional(),
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
  // Sanity cap on payload size only — the real "max 10 favorites" business
  // rule is enforced in categoryService.updateUserFavoriteCategories, where
  // it can still allow a user who is already over the limit to shrink back
  // down (a hard .max(10) here would make that impossible: sending 13 ids
  // to remove 1 from 14 would be rejected before it ever reaches the check).
  categoryIds: z.array(z.string().uuid()).max(100),
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
