import { usageService } from '@/business/services/usage/usage.service';
import { FastifyReply, FastifyRequest } from 'fastify';
import { JwtPayload } from 'jsonwebtoken';

const getCurrent = async (req: FastifyRequest, reply: FastifyReply) => {
  const { userId } = req.user as JwtPayload;
  const data = await usageService.getCurrentUsage(userId);
  reply.send({ message: 'Usage fetched successfully', data });
};

export const usageHandler = { getCurrent };
