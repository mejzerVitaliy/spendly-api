import { FastifyInstance } from 'fastify';
import { currencyHandler } from './currency.handler';
import {
  addUserFavoriteCurrencyBodySchema,
  getAllCurrenciesResponseSchema,
  getUserFavoriteCurrenciesResponseSchema,
  removeUserFavoriteCurrencyParamsSchema,
  updateUserFavoriteCurrenciesBodySchema,
  messageResponseSchema,
} from '@/business';

export const currencyRoute = async (fastify: FastifyInstance) => {
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Currency'],
        summary: 'Get all currencies',
        response: {
          200: getAllCurrenciesResponseSchema,
        },
      },
    },
    currencyHandler.getAllCurrencies,
  );

  fastify.get(
    '/favorites',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Currency'],
        summary: 'Get user favorite currencies',
        response: {
          200: getUserFavoriteCurrenciesResponseSchema,
        },
      },
    },
    currencyHandler.getUserFavoriteCurrencies,
  );

  fastify.post(
    '/favorites',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Currency'],
        summary: 'Add user favorite currency',
        body: addUserFavoriteCurrencyBodySchema,
        response: {
          200: messageResponseSchema,
        },
      },
    },
    currencyHandler.addUserFavoriteCurrency,
  );

  fastify.delete(
    '/favorites/:currencyCode',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Currency'],
        summary: 'Remove user favorite currency',
        params: removeUserFavoriteCurrencyParamsSchema,
        response: {
          200: messageResponseSchema,
        },
      },
    },
    currencyHandler.removeUserFavoriteCurrency,
  );

  fastify.put(
    '/favorites',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Currency'],
        summary: 'Update user favorite currencies',
        body: updateUserFavoriteCurrenciesBodySchema,
        response: {
          200: messageResponseSchema,
        },
      },
    },
    currencyHandler.updateUserFavoriteCurrencies,
  );
};
