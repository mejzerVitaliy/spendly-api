import { FastifyInstance } from 'fastify';
import { notificationsHandler } from './notifications.handler';
import {
  registerPushTokenBodySchema,
  unregisterPushTokenBodySchema,
  updateReminderSettingsBodySchema,
  reminderSettingsResponseSchema,
  notificationHistoryResponseSchema,
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

  fastify.get(
    '/reminder-settings',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['notifications'],
        summary: "Get the user's transaction-reminder schedule",
        response: { 200: reminderSettingsResponseSchema },
      },
    },
    notificationsHandler.getReminderSettings,
  );

  fastify.put(
    '/reminder-settings',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['notifications'],
        summary:
          "Set the user's transaction-reminder schedule (hour/minute already converted to UTC client-side)",
        body: updateReminderSettingsBodySchema,
        response: { 200: reminderSettingsResponseSchema },
      },
    },
    notificationsHandler.updateReminderSettings,
  );

  fastify.get(
    '/history',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['notifications'],
        summary:
          'Recent server-dispatched notifications, for the client to backfill its in-app list',
        response: { 200: notificationHistoryResponseSchema },
      },
    },
    notificationsHandler.getHistory,
  );
};
