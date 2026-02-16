import { FastifyReply, FastifyRequest } from 'fastify';
import {
  GuestInput,
  LoginInput,
  RefreshTokenInput,
  RefreshTokenResponse,
  RegisterInput,
  UnauthorizedError,
  UpgradeGuestInput,
} from '@/business';
import { authService } from '@/business/services/auth/auth.service';
import { JwtPayload } from 'jsonwebtoken';
import { tokenService } from '@/business/services/tokens/token.service';
import { TokenType } from '@prisma/client';

const guest = async (
  req: FastifyRequest<{
    Body: GuestInput;
  }>,
  reply: FastifyReply,
) => {
  const { body } = req;

  const { createdUser, accessToken, refreshToken } =
    await authService.createGuest(body);

  const response = {
    message: 'Guest user created successfully',
    data: {
      user: createdUser,
      accessToken,
      refreshToken,
    },
  };

  reply.send(response);
};

const upgradeGuest = async (
  req: FastifyRequest<{
    Body: UpgradeGuestInput;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { body } = req;

  const { user, accessToken, refreshToken } = await authService.upgradeGuest(
    userId,
    body,
  );

  const response = {
    message: 'Guest upgraded to registered user successfully',
    data: {
      user,
      accessToken,
      refreshToken,
    },
  };

  reply.send(response);
};

const register = async (
  req: FastifyRequest<{
    Body: RegisterInput;
  }>,
  reply: FastifyReply,
) => {
  const { body } = req;

  const { createdUser, accessToken, refreshToken } =
    await authService.register(body);

  const response = {
    message: 'User is registered successfully',
    data: {
      user: createdUser,
      accessToken,
      refreshToken,
    },
  };

  reply.send(response);
};

const login = async (
  request: FastifyRequest<{
    Body: LoginInput;
  }>,
  reply: FastifyReply,
) => {
  const { body } = request;

  const data = await authService.login(body);

  const response = {
    message: 'User is logged in successfully',
    data,
  };

  reply.send(response);
};

const getMe = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user as JwtPayload;

  const data = await authService.getMe(userId);

  const response = {
    message: 'User is fetched successfully',
    data,
  };

  reply.send(response);
};

const refresh = async (
  request: FastifyRequest<{
    Body: RefreshTokenInput;
  }>,
  reply: FastifyReply,
) => {
  const { refreshToken } = request.body;

  if (!refreshToken) {
    throw UnauthorizedError('Refresh token is missing');
  }

  const { accessToken, newRefreshToken } =
    await authService.refresh(refreshToken);

  const response: RefreshTokenResponse = {
    message: 'Tokens refreshed successfully',
    data: {
      accessToken,
      refreshToken: newRefreshToken,
    },
  };

  return reply.send(response);
};

const logout = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user as JwtPayload;

  await tokenService.removeAllByUserId(userId, TokenType.REFRESH);

  const response = {
    message: 'User is logged out successfully',
  };

  reply.send(response);
};

export const authHandler = {
  guest,
  upgradeGuest,
  register,
  login,
  getMe,
  refresh,
  logout,
};
