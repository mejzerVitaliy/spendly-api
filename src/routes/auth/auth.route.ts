import { FastifyInstance } from 'fastify';
import {
  getMeResponseSchema,
  guestBodySchema,
  guestResponseSchema,
  loginBodySchema,
  loginResponseSchema,
  messageResponseSchema,
  refreshTokenBodySchema,
  refreshTokenResponseSchema,
  registerBodySchema,
  registerResponseSchema,
  upgradeGuestBodySchema,
  upgradeGuestResponseSchema,
} from '../../business';
import { authHandler } from './auth.handler';

export const authRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    '/guest',
    {
      schema: {
        tags: ['auth'],
        summary: 'Create a guest user with onboarding data',
        body: guestBodySchema,
        response: {
          200: guestResponseSchema,
        },
      },
    },
    authHandler.guest,
  );

  fastify.post(
    '/upgrade',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['auth'],
        summary: 'Upgrade guest user to registered user',
        body: upgradeGuestBodySchema,
        response: {
          200: upgradeGuestResponseSchema,
        },
      },
    },
    authHandler.upgradeGuest,
  );

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
