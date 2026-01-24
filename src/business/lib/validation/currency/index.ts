import { z } from 'zod';
import { createResponseWithDataSchema } from '../application';

export const currencySchema = z.object({
  code: z.string().length(3),
  name: z.string(),
});

export const getAllCurrenciesResponseSchema = createResponseWithDataSchema(
  z.array(currencySchema),
);

export const favoriteCurrencySchema = z.object({
  currencyCode: z.string().length(3),
  order: z.number(),
  currency: currencySchema,
});

export const getUserFavoriteCurrenciesResponseSchema =
  createResponseWithDataSchema(z.array(favoriteCurrencySchema));

export const addUserFavoriteCurrencyBodySchema = z.object({
  currencyCode: z.string().length(3),
});

type AddUserFavoriteCurrencyInput = z.infer<
  typeof addUserFavoriteCurrencyBodySchema
>;

export const addUserFavoriteCurrencyResponseSchema =
  createResponseWithDataSchema(favoriteCurrencySchema);

export const removeUserFavoriteCurrencyParamsSchema = z.object({
  currencyCode: z.string().length(3),
});

type RemoveUserFavoriteCurrencyParams = z.infer<
  typeof removeUserFavoriteCurrencyParamsSchema
>;

export const updateUserFavoriteCurrenciesBodySchema = z.object({
  currencyCodes: z.array(z.string().length(3)).max(5),
});

type UpdateUserFavoriteCurrenciesInput = z.infer<
  typeof updateUserFavoriteCurrenciesBodySchema
>;

export const updateUserFavoriteCurrenciesResponseSchema =
  createResponseWithDataSchema(z.array(favoriteCurrencySchema));

export type {
  AddUserFavoriteCurrencyInput,
  RemoveUserFavoriteCurrencyParams,
  UpdateUserFavoriteCurrenciesInput,
};
