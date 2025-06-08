import { Category, Currency, TransactionType } from '@prisma/client';
import { z } from 'zod';
import { createResponseWithDataSchema } from '@/business/lib/validation';

export const transactionBaseSchema = z.object({
  id: z.string().uuid(),
  amount: z.number(),
  date: z.string().datetime(),
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
