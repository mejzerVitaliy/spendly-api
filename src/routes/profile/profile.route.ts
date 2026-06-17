import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { profileHandler } from './profile.handler';
import { messageResponseSchema } from '@/business/lib';

export const profileRoutes = async (fastify: FastifyInstance) => {
  fastify.put(
    '/update-settings',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['profile'],
        summary: 'Update user settings (main currency)',
        body: z.object({ mainCurrencyCode: z.string().length(3) }),
        response: { 200: messageResponseSchema },
      },
    },
    profileHandler.updateSettings,
  );

  fastify.put(
    '/update-email',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['profile'],
        summary: 'Update user email',
        body: z.object({ email: z.string().email() }),
        response: { 200: messageResponseSchema },
      },
    },
    profileHandler.updateEmail,
  );

  fastify.put(
    '/change-password',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['profile'],
        summary: 'Change user password',
        body: z.object({
          currentPassword: z.string().min(1),
          newPassword: z.string().min(6),
        }),
        response: { 200: messageResponseSchema },
      },
    },
    profileHandler.changePassword,
  );

  fastify.delete(
    '/',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['profile'],
        summary: 'Delete user account',
        response: { 200: messageResponseSchema },
      },
    },
    profileHandler.deleteAccount,
  );
};
