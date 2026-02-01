import { TransactionType } from '@prisma/client';
import { z } from 'zod';
import { createResponseWithDataSchema } from '../application';
import { categorySchema } from '../category';

export const transactionBaseSchema = z.object({
  id: z.string().uuid(),
  amount: z.number(),
  date: z.string().datetime(),
  currencyCode: z.string().length(3),
  description: z.string().optional(),
  categoryId: z.string().uuid(),
  category: categorySchema.optional(),
  walletId: z.string().uuid(),
  type: z.nativeEnum(TransactionType),
});

export const createTransactionBodySchema = z.object({
  amount: z.number(),
  date: z.string().datetime(),
  currencyCode: z.string().length(3),
  description: z.string().optional(),
  categoryId: z.string().uuid(),
  walletId: z.string().uuid().optional(),
  type: z.nativeEnum(TransactionType),
});

type CreateTransactionInput = z.infer<typeof createTransactionBodySchema>;

export const createTransactionResponseSchema = createResponseWithDataSchema(
  transactionBaseSchema,
);

export const getAllTransactionsResponseSchema = createResponseWithDataSchema(
  z.array(transactionBaseSchema),
);

export const getTransactionByIdResponseSchema = createResponseWithDataSchema(
  transactionBaseSchema,
);

const updateTransactionBodySchema = transactionBaseSchema.partial();

type UpdateTransactionInput = z.infer<typeof updateTransactionBodySchema>;

export const updateTransactionResponseSchema = createResponseWithDataSchema(
  transactionBaseSchema,
);

export type { CreateTransactionInput, UpdateTransactionInput };
