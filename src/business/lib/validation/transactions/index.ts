import { Currency, TransactionType } from "@prisma/client";
import { z } from "zod";
import { createResponseWithDataSchema } from "../application";

export const transactionSchema = z.object({
  id: z.string().uuid(),
  value: z.number(),
  currency: z.nativeEnum(Currency),
  categoryId: z.string().uuid().optional(),
  madeAt: z.date(),
  type: z.nativeEnum(TransactionType),
  comment: z.string().optional(),
});

export const createTransactionBodySchema = transactionSchema.pick({
  value: true,
  currency: true,
  type: true,
  comment: true,
}).extend({
  categoryId: z.string().uuid().optional(),
});

type CreateTransactionInput = z.infer<typeof createTransactionBodySchema>;

export const getAllTransactionsResponseSchema = createResponseWithDataSchema(
  z.object({
    transactions: z.array(transactionSchema),
  })
)

type GetAllTransactionsResponse = z.infer<typeof getAllTransactionsResponseSchema>

export const updateTransactionBodySchema = createTransactionBodySchema;

type UpdateTransactionInput = z.infer<typeof updateTransactionBodySchema>;

export type { CreateTransactionInput, GetAllTransactionsResponse, UpdateTransactionInput };
