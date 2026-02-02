import { FastifyInstance } from 'fastify';
import { walletHandler } from './wallet.handler';
import {
  createWalletBodySchema,
  createWalletResponseSchema,
  getAllWalletsResponseSchema,
  getWalletByIdResponseSchema,
  updateWalletBodySchema,
  updateWalletResponseSchema,
  setDefaultWalletBodySchema,
  getTotalBalanceResponseSchema,
} from '@/business';
import { messageResponseSchema } from '@/business/lib';

export const walletRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    '/',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['wallet'],
        summary: 'Create a new wallet',
        body: createWalletBodySchema,
        response: {
          200: createWalletResponseSchema,
        },
      },
    },
    walletHandler.create,
  );

  fastify.get(
    '/',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['wallet'],
        summary: 'Get all wallets',
        response: {
          200: getAllWalletsResponseSchema,
        },
      },
    },
    walletHandler.getAll,
  );

  fastify.get(
    '/default',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['wallet'],
        summary: 'Get default wallet',
        response: {
          200: getWalletByIdResponseSchema,
        },
      },
    },
    walletHandler.getDefault,
  );

  fastify.get(
    '/total-balance',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['wallet'],
        summary: 'Get total balance across all wallets',
        response: {
          200: getTotalBalanceResponseSchema,
        },
      },
    },
    walletHandler.getTotalBalance,
  );

  fastify.get(
    '/:id',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['wallet'],
        summary: 'Get a wallet by id',
        response: {
          200: getWalletByIdResponseSchema,
        },
      },
    },
    walletHandler.getById,
  );

  fastify.put(
    '/:id',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['wallet'],
        summary: 'Update a wallet by id',
        body: updateWalletBodySchema,
        response: {
          200: updateWalletResponseSchema,
        },
      },
    },
    walletHandler.update,
  );

  fastify.post(
    '/:id/archive',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['wallet'],
        summary: 'Archive a wallet',
        response: {
          200: messageResponseSchema,
        },
      },
    },
    walletHandler.archive,
  );

  fastify.post(
    '/:id/unarchive',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['wallet'],
        summary: 'Unarchive a wallet',
        response: {
          200: messageResponseSchema,
        },
      },
    },
    walletHandler.unarchive,
  );

  fastify.post(
    '/set-default',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['wallet'],
        summary: 'Set default wallet',
        body: setDefaultWalletBodySchema,
        response: {
          200: updateWalletResponseSchema,
        },
      },
    },
    walletHandler.setDefault,
  );
};
