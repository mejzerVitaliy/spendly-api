import { Category, TransactionType } from '@prisma/client';
import { z } from 'zod';
import { createResponseWithDataSchema } from '../application';

export const transactionBaseSchema = z.object({
  id: z.string().uuid(),
  amount: z.number(),
  date: z.string().datetime(),
  currencyCode: z.string().length(3),
  description: z.string().optional(),
  category: z.nativeEnum(Category),
  type: z.nativeEnum(TransactionType),
});

export const createTransactionBodySchema = transactionBaseSchema.pick({
  amount: true,
  date: true,
  currencyCode: true,
  description: true,
  category: true,
  type: true,
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
