import { FastifyInstance } from 'fastify';
import { notificationsHandler } from './notifications.handler';
import {
  registerPushTokenBodySchema,
  unregisterPushTokenBodySchema,
  messageResponseSchema,
} from '@/business/lib';

export const notificationsRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    '/push-token',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['notifications'],
        summary:
          'Register (or re-point) an Expo push token for the current user',
        body: registerPushTokenBodySchema,
        response: { 200: messageResponseSchema },
      },
    },
    notificationsHandler.registerPushToken,
  );

  fastify.delete(
    '/push-token',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['notifications'],
        summary: 'Unregister a push token (e.g. on logout)',
        body: unregisterPushTokenBodySchema,
        response: { 200: messageResponseSchema },
      },
    },
    notificationsHandler.unregisterPushToken,
  );
};
