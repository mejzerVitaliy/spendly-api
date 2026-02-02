import { FastifyInstance } from 'fastify';
import { categoryHandler } from './category.handler';
import {
  addUserFavoriteCategoryBodySchema,
  getAllCategoriesResponseSchema,
  getUserFavoriteCategoriesResponseSchema,
  removeUserFavoriteCategoryParamsSchema,
  updateUserFavoriteCategoriesBodySchema,
  messageResponseSchema,
} from '@/business';

export const categoryRoute = async (fastify: FastifyInstance) => {
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Category'],
        summary: 'Get all categories',
        response: {
          200: getAllCategoriesResponseSchema,
        },
      },
    },
    categoryHandler.getAllCategories,
  );

  fastify.get(
    '/favorites',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Category'],
        summary: 'Get user favorite categories',
        response: {
          200: getUserFavoriteCategoriesResponseSchema,
        },
      },
    },
    categoryHandler.getUserFavoriteCategories,
  );

  fastify.post(
    '/favorites',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Category'],
        summary: 'Add user favorite category',
        body: addUserFavoriteCategoryBodySchema,
        response: {
          200: messageResponseSchema,
        },
      },
    },
    categoryHandler.addUserFavoriteCategory,
  );

  fastify.delete(
    '/favorites/:categoryId',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Category'],
        summary: 'Remove user favorite category',
        params: removeUserFavoriteCategoryParamsSchema,
        response: {
          200: messageResponseSchema,
        },
      },
    },
    categoryHandler.removeUserFavoriteCategory,
  );

  fastify.put(
    '/favorites',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Category'],
        summary: 'Update user favorite categories',
        body: updateUserFavoriteCategoriesBodySchema,
        response: {
          200: messageResponseSchema,
        },
      },
    },
    categoryHandler.updateUserFavoriteCategories,
  );
};
