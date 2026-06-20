import { FastifyInstance } from 'fastify';
import { usageHandler } from './usage.handler';

export const usageRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/current', {
    preHandler: fastify.authenticate,
    schema: {
      tags: ['usage'],
      summary: 'Get current month AI usage',
    },
    handler: usageHandler.getCurrent,
  });
};
