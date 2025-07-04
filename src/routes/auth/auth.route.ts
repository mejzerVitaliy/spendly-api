import { FastifyInstance } from 'fastify';
import {
  getMeResponseSchema,
  loginBodySchema,
  loginResponseSchema,
  loginTwoFactorBodySchema,
  loginTwoFactorResendBodySchema,
  loginTwoFactorResponseSchema,
  messageResponseSchema,
  refreshTokenBodySchema,
  refreshTokenResponseSchema,
  registerBodySchema,
  registerResponseSchema,
} from '../../business';
import { authHandler } from './auth.handler';

export const authRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    '/register',
    {
      schema: {
        tags: ['auth'],
        summary: 'Register a new user',
        body: registerBodySchema,
        response: {
          200: registerResponseSchema,
        },
      },
    },
    authHandler.register,
  );

  fastify.post(
    '/login',
    {
      schema: {
        tags: ['auth'],
        summary: 'Login a user',
        body: loginBodySchema,
        response: {
          200: loginResponseSchema,
        },
      },
    },
    authHandler.login,
  );

  fastify.post(
    '/login/two-factor',
    {
      schema: {
        tags: ['auth'],
        summary: 'Login a user with two-factor authentication',
        body: loginTwoFactorBodySchema,
        response: {
          200: loginTwoFactorResponseSchema,
        },
      },
    },
    authHandler.loginTwoFactor,
  );

  fastify.post(
    '/login/two-factor/resend',
    {
      schema: {
        tags: ['auth'],
        summary: 'Resend two-factor authentication code',
        body: loginTwoFactorResendBodySchema,
        response: {
          200: messageResponseSchema,
        },
      },
    },
    authHandler.loginTwoFactorResend,
  );

  fastify.put(
    '/toggle-two-factor',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['auth'],
        summary: 'Toggle two-factor authentication',
        response: {
          200: messageResponseSchema,
        },
      },
    },
    authHandler.toggleTwoFactor,
  );

  fastify.get(
    '/me',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['auth'],
        summary: 'Get current user',
        response: {
          200: getMeResponseSchema,
        },
      },
    },
    authHandler.getMe,
  );

  fastify.post(
    '/refresh',
    {
      schema: {
        tags: ['auth'],
        summary: 'Refresh tokens',
        body: refreshTokenBodySchema,
        response: {
          200: refreshTokenResponseSchema,
        },
      },
    },
    authHandler.refresh,
  );

  fastify.put(
    '/logout',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['auth'],
        summary: 'Logout user',
        response: {
          200: messageResponseSchema,
        },
      },
    },
    authHandler.logout,
  );
};
