import { FastifyReply, FastifyRequest } from 'fastify';
import {
  LoginInput,
  LoginTwoFactorInput,
  LoginTwoFactorResendInput,
  RefreshTokenInput,
  RefreshTokenResponse,
  RegisterInput,
  UnauthorizedError,
} from '@/business';
import { authService } from '@/business/services/auth/auth.service';
import { JwtPayload } from 'jsonwebtoken';
import { tokenService } from '@/business/services/tokens/token.service';
import { TokenType } from '@prisma/client';

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

const loginTwoFactor = async (
  request: FastifyRequest<{
    Body: LoginTwoFactorInput;
  }>,
  reply: FastifyReply,
) => {
  const { body } = request;

  const data = await authService.loginTwoFactor(body);

  const response = {
    message: 'User is logged in successfully with two-factor authentication',
    data,
  };

  reply.send(response);
};

const loginTwoFactorResend = async (
  request: FastifyRequest<{
    Body: LoginTwoFactorResendInput;
  }>,
  reply: FastifyReply,
) => {
  const { body } = request;

  const data = await authService.loginTwoFactorResend(body);

  const response = {
    message: 'Two-factor authentication code is resent successfully',
  };

  reply.send(response);
};

const toggleTwoFactor = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user as JwtPayload;

  await authService.toggleTwoFactor(userId);

  const response = {
    message: 'Two-factor authentication is toggled successfully',
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
  register,
  login,
  loginTwoFactor,
  loginTwoFactorResend,
  toggleTwoFactor,
  getMe,
  refresh,
  logout,
};
