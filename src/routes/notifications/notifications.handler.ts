import { FastifyReply, FastifyRequest } from 'fastify';
import { JwtPayload } from 'jsonwebtoken';
import {
  pushTokenService,
  reminderSettingsService,
  notificationHistoryService,
} from '@/business/services/notifications';
import {
  RegisterPushTokenInput,
  UnregisterPushTokenInput,
  UpdateReminderSettingsInput,
} from '@/business/lib';

const registerPushToken = async (
  req: FastifyRequest<{ Body: RegisterPushTokenInput }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { token, language } = req.body;

  await pushTokenService.register(userId, token, language);

  reply.send({ message: 'Push token registered' });
};

const unregisterPushToken = async (
  req: FastifyRequest<{ Body: UnregisterPushTokenInput }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { token } = req.body;

  await pushTokenService.unregister(userId, token);

  reply.send({ message: 'Push token unregistered' });
};

const getReminderSettings = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const settings = await reminderSettingsService.get(userId);
  reply.send({ message: 'Reminder settings fetched', data: settings });
};

const updateReminderSettings = async (
  req: FastifyRequest<{ Body: UpdateReminderSettingsInput }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const settings = await reminderSettingsService.update(userId, req.body);
  reply.send({ message: 'Reminder settings updated', data: settings });
};

const getHistory = async (req: FastifyRequest, reply: FastifyReply) => {
  const { userId } = req.user as JwtPayload;
  const history = await notificationHistoryService.getRecent(userId);
  reply.send({ message: 'Notification history fetched', data: history });
};

export const notificationsHandler = {
  registerPushToken,
  unregisterPushToken,
  getReminderSettings,
  updateReminderSettings,
  getHistory,
};
