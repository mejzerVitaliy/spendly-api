import { TransactionType } from '@prisma/client';
import { z } from 'zod';
import { createResponseWithDataSchema } from '../application';
import { categorySchema } from '../category';

export const transactionBaseSchema = z.object({
  id: z.string().uuid(),
  amount: z.number(),
  date: z.string().datetime(),
  currencyCode: z.string().length(3),
  description: z.string().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  category: categorySchema.optional().nullable(),
  walletId: z.string().uuid(),
  type: z.nativeEnum(TransactionType),
  convertedAmount: z.number().optional(),
  mainCurrencyCode: z.string().length(3).optional(),
  transferGroupId: z.string().uuid().optional().nullable(),
  pairedTransactionWalletId: z.string().uuid().optional().nullable(),
  pairedTransactionCurrencyCode: z.string().optional().nullable(),
  pairedTransactionAmount: z.number().optional().nullable(),
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

export const createTransferBodySchema = z.object({
  fromWalletId: z.string().uuid(),
  toWalletId: z.string().uuid(),
  fromAmount: z.number().positive(),
  date: z.string().datetime(),
  description: z.string().optional(),
});

type CreateTransferInput = z.infer<typeof createTransferBodySchema>;

export const createTransferResponseSchema = createResponseWithDataSchema(
  z.object({
    fromTransaction: transactionBaseSchema,
    toTransaction: transactionBaseSchema,
    exchangeRate: z.number(),
    fromCurrencyCode: z.string(),
    toCurrencyCode: z.string(),
    fromAmount: z.number(),
    toAmount: z.number(),
  }),
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

export const parseTextTransactionBodySchema = z.object({
  text: z.string().min(1),
});

type ParseTextTransactionInput = z.infer<typeof parseTextTransactionBodySchema>;

export const parseTextTransactionResponseSchema = createResponseWithDataSchema(
  z.array(transactionBaseSchema),
);

export const parseVoiceTransactionResponseSchema = createResponseWithDataSchema(
  z.array(transactionBaseSchema),
);

export const updateTransferBodySchema = z.object({
  fromAmount: z.number().positive(),
  date: z.string().datetime(),
  description: z.string().optional(),
});

type UpdateTransferInput = z.infer<typeof updateTransferBodySchema>;

export const updateTransferResponseSchema = createResponseWithDataSchema(
  z.object({
    fromTransaction: transactionBaseSchema,
    toTransaction: transactionBaseSchema,
  }),
);

export type {
  CreateTransactionInput,
  CreateTransferInput,
  UpdateTransactionInput,
  UpdateTransferInput,
  ParseTextTransactionInput,
};
