import { TokenType } from "@prisma/client";
import { tokenRepository } from "../../../database/repositories/token/token.repository";

const save = async (userId: string, token: string, type: TokenType) => {
  const foundToken = await tokenRepository.findFirst({
    where: {
      userId,
      type,
      token
    }
  })

  if (!foundToken) {
    return await tokenRepository.create({
      data: {
        userId,
        token,
        type
      }
    })
  }

  return await tokenRepository.update({
    where: {
      id: foundToken.id
    },
    data: {
      token
    }
  })
}

const getByToken = async (token: string) => {
  return tokenRepository.findUnique({
      where: {
          token,
      },
  });
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