import { FastifyInstance } from 'fastify';
import { transactionHandler } from './transaction.handler';
import {
  createTransactionBodySchema,
  createTransactionResponseSchema,
  createTransferBodySchema,
  createTransferResponseSchema,
  getAllTransactionsResponseSchema,
  getTransactionByIdResponseSchema,
  parseTextTransactionBodySchema,
  parseTextTransactionResponseSchema,
  parseVoiceTransactionResponseSchema,
  updateTransactionResponseSchema,
  updateTransferBodySchema,
  updateTransferResponseSchema,
} from '@/business';
import { messageResponseSchema } from '@/business/lib';

export const transactionRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    '/',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['transaction'],
        summary: 'Create a new transaction',
        body: createTransactionBodySchema,
        response: {
          200: createTransactionResponseSchema,
        },
      },
    },
    transactionHandler.create,
  );

  fastify.get(
    '/',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['transaction'],
        summary: 'Get all transactions',
        response: {
          200: getAllTransactionsResponseSchema,
        },
      },
    },
    transactionHandler.getAll,
  );

  fastify.post(
    '/transfer',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['transaction'],
        summary: 'Create a transfer between wallets',
        body: createTransferBodySchema,
        response: {
          200: createTransferResponseSchema,
        },
      },
    },
    transactionHandler.createTransfer,
  );

  fastify.put(
    '/transfer/:transferGroupId',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['transaction'],
        summary: 'Update a transfer by its group ID',
        body: updateTransferBodySchema,
        response: { 200: updateTransferResponseSchema },
      },
    },
    transactionHandler.updateTransfer,
  );

  fastify.post(
    '/parse-text',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['transaction'],
        summary: 'Create a transaction from text using AI',
        body: parseTextTransactionBodySchema,
        response: {
          200: parseTextTransactionResponseSchema,
        },
      },
    },
    transactionHandler.createFromText,
  );

  fastify.post(
    '/parse-voice',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['transaction'],
        summary: 'Create transactions from voice recording using AI',
        response: {
          200: parseVoiceTransactionResponseSchema,
        },
      },
    },
    transactionHandler.createFromVoice,
  );

  fastify.get(
    '/:id',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['transaction'],
        summary: 'Get a transaction by id',
        response: {
          200: getTransactionByIdResponseSchema,
        },
      },
    },
    transactionHandler.getById,
  );

  fastify.put(
    '/:id',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['transaction'],
        summary: 'Update a transaction by id',
        response: {
          200: updateTransactionResponseSchema,
        },
      },
    },
    transactionHandler.update,
  );

  fastify.delete(
    '/:id',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['transaction'],
        summary: 'Delete a transaction by id',
        response: {
          200: messageResponseSchema,
        },
      },
    },
    transactionHandler.remove,
  );
};
