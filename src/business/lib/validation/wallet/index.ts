import { WalletType } from '@prisma/client';
import { z } from 'zod';
import { createResponseWithDataSchema } from '../application';

export const walletBaseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(50),
  type: z.nativeEnum(WalletType),
  currencyCode: z.string().length(3),
  initialBalance: z.number().int(),
  currentBalance: z.number().int(),
  convertedBalance: z.number().int().optional(),
  mainCurrencyCode: z.string().length(3).optional(),
  isDefault: z.boolean(),
  isArchived: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createWalletBodySchema = z.object({
  name: z.string().min(1).max(50),
  currencyCode: z.string().length(3),
  type: z.nativeEnum(WalletType).optional(),
  initialBalance: z.number().int().optional(),
});

export type CreateWalletInput = z.infer<typeof createWalletBodySchema>;

export const updateWalletBodySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  type: z.nativeEnum(WalletType).optional(),
});

export type UpdateWalletInput = z.infer<typeof updateWalletBodySchema>;

export const setDefaultWalletBodySchema = z.object({
  walletId: z.string().uuid(),
});

export type SetDefaultWalletInput = z.infer<typeof setDefaultWalletBodySchema>;

export const createWalletResponseSchema =
  createResponseWithDataSchema(walletBaseSchema);

export const getAllWalletsResponseSchema = createResponseWithDataSchema(
  z.array(walletBaseSchema),
);

export const getWalletByIdResponseSchema =
  createResponseWithDataSchema(walletBaseSchema);

export const updateWalletResponseSchema =
  createResponseWithDataSchema(walletBaseSchema);

export const getTotalBalanceResponseSchema = createResponseWithDataSchema(
  z.object({
    totalBalance: z.number().int(),
    walletsCount: z.number().int(),
  }),
);
