import { FastifyReply, FastifyRequest } from 'fastify';
import { JwtPayload } from 'jsonwebtoken';
import { pushTokenService } from '@/business/services/notifications';
import {
  RegisterPushTokenInput,
  UnregisterPushTokenInput,
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

export const notificationsHandler = {
  registerPushToken,
  unregisterPushToken,
};
