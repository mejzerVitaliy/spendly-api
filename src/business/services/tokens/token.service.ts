import { TokenType } from '@prisma/client';
import { tokenRepository } from '../../../database/repositories/token/token.repository';
import { UnauthorizedError } from '@/business';

const save = async (userId: string, token: string, type: TokenType) => {
  // Remove all existing tokens of this type for the user
  await removeAllByUserId(userId, type);

  // Create new token
  return await tokenRepository.create({
    data: {
      userId,
      token,
      type,
    },
  });
};

const getByToken = async (token: string) => {
  const foundToken = await tokenRepository.findUnique({
    where: {
      token,
    },
    include: {
      user: true,
    },
  });

  if (!foundToken) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  return foundToken;
};

const getByUserId = async (userId: string, type: TokenType) => {
  return tokenRepository.findFirst({
    where: {
      userId,
      type,
    },
  });
};

const removeByToken = async (token: string) => {
  await tokenRepository.delete({
    where: {
      token,
    },
  });
};

const removeAllByUserId = async (userId: string, type: TokenType) => {
  await tokenRepository.deleteMany({
    where: {
      userId,
      type,
    },
  });
};

export const tokenService = {
  save,
  getByToken,
  removeByToken,
  removeAllByUserId,
  getByUserId,
};
