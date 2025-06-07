import { Category, Currency, TransactionType } from '@prisma/client';
import { z } from 'zod';
import { createResponseWithDataSchema } from '../..';

export const transactionBaseSchema = z.object({
  id: z.string().uuid(),
  amount: z.number(),
  date: z.date(),
  currency: z.nativeEnum(Currency),
  description: z.string().optional(),
  category: z.nativeEnum(Category),
  type: z.nativeEnum(TransactionType),
});

export const createTransactionBodySchema = transactionBaseSchema.pick({
  amount: true,
  date: true,
  currency: true,
  description: true,
  category: true,
  type: true,
});

type CreateTransactionInput = z.infer<typeof createTransactionBodySchema>;

export const createTransactionResponseSchema = createResponseWithDataSchema(
  z.object({
    transaction: transactionBaseSchema,
  }),
);

export const getAllTransactionsResponseSchema = createResponseWithDataSchema(
  z.object({
    transactions: transactionBaseSchema.array(),
  }),
);

export const getTransactionByIdResponseSchema = createResponseWithDataSchema(
  z.object({
    transaction: transactionBaseSchema,
  }),
);

const updateTransactionBodySchema = transactionBaseSchema.partial();

type UpdateTransactionInput = z.infer<typeof updateTransactionBodySchema>;

export const updateTransactionResponseSchema = createResponseWithDataSchema(
  z.object({
    transaction: transactionBaseSchema,
  }),
);

export type { CreateTransactionInput, UpdateTransactionInput };
