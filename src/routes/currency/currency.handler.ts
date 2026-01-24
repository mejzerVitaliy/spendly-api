import { currencyService } from '@/business/services/currency';
import { FastifyReply, FastifyRequest } from 'fastify';
import { JwtPayload } from 'jsonwebtoken';
import {
  AddUserFavoriteCurrencyInput,
  RemoveUserFavoriteCurrencyParams,
  UpdateUserFavoriteCurrenciesInput,
} from '@/business';

const getAllCurrencies = async (req: FastifyRequest, reply: FastifyReply) => {
  const currencies = await currencyService.getAllCurrencies();

  const response = {
    message: 'Currencies retrieved successfully',
    data: currencies,
  };

  reply.send(response);
};

const getUserFavoriteCurrencies = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;

  const favoriteCurrencies =
    await currencyService.getUserFavoriteCurrencies(userId);

  const response = {
    message: 'Favorite currencies retrieved successfully',
    data: favoriteCurrencies,
  };

  reply.send(response);
};

const addUserFavoriteCurrency = async (
  req: FastifyRequest<{
    Body: AddUserFavoriteCurrencyInput;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { currencyCode } = req.body;

  const favoriteCurrency = await currencyService.addUserFavoriteCurrency(
    userId,
    currencyCode,
  );

  const response = {
    message: 'Favorite currency added successfully',
    data: favoriteCurrency,
  };

  reply.send(response);
};

const removeUserFavoriteCurrency = async (
  req: FastifyRequest<{
    Params: RemoveUserFavoriteCurrencyParams;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { currencyCode } = req.params;

  await currencyService.removeUserFavoriteCurrency(userId, currencyCode);

  const response = {
    message: 'Favorite currency removed successfully',
  };

  reply.send(response);
};

const updateUserFavoriteCurrencies = async (
  req: FastifyRequest<{
    Body: UpdateUserFavoriteCurrenciesInput;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { currencyCodes } = req.body;

  const favoriteCurrencies = await currencyService.updateUserFavoriteCurrencies(
    userId,
    currencyCodes,
  );

  const response = {
    message: 'Favorite currencies updated successfully',
    data: favoriteCurrencies,
  };

  reply.send(response);
};

export const currencyHandler = {
  getAllCurrencies,
  getUserFavoriteCurrencies,
  addUserFavoriteCurrency,
  removeUserFavoriteCurrency,
  updateUserFavoriteCurrencies,
};
