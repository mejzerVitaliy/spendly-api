import { FastifyInstance } from 'fastify';
import {
  updateProfileBodySchema,
  messageResponseSchema,
  updatePasswordBodySchema,
  updateSettingsBodySchema,
} from '../../business';
import { profileHandler } from './profile.handler';

export const profileRoutes = async (fastify: FastifyInstance) => {
  fastify.put(
    '/update',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['profile'],
        summary: 'Update user profile',
        body: updateProfileBodySchema,
        response: {
          200: messageResponseSchema,
        },
      },
    },
    profileHandler.updateProfile,
  );

  fastify.post(
    '/update-avatar',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['profile'],
        summary: 'Upload user avatar',
        consumes: ['multipart/form-data'],
        response: {
          200: messageResponseSchema,
        },
      },
    },
    profileHandler.updateAvatar,
  );

  fastify.delete(
    '/delete-avatar',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['profile'],
        summary: 'Delete user avatar',
        response: {
          200: messageResponseSchema,
        },
      },
    },
    profileHandler.deleteAvatar,
  );

  fastify.put(
    '/update-password',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['profile'],
        summary: 'Update user password',
        body: updatePasswordBodySchema,
        response: {
          200: messageResponseSchema,
        },
      },
    },
    profileHandler.updatePassword,
  );

  fastify.delete(
    '/delete',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['profile'],
        summary: 'Delete user',
        response: {
          200: messageResponseSchema,
        },
      },
    },
    profileHandler.deleteUser,
  );

  fastify.put(
    '/update-settings',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['profile'],
        summary: 'Update user settings',
        body: updateSettingsBodySchema,
        response: {
          200: messageResponseSchema,
        },
      },
    },
    profileHandler.updateSettings,
  );
};
