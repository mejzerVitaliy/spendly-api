import { FastifyInstance } from 'fastify';
import { analyticsHandler } from './analytics.handler';
import { trackEventBodySchema } from '@/business/lib/validation/analytics';
import { messageResponseSchema } from '@/business/lib';

export const analyticsRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    '/event',
    {
      config: {
        rateLimit: { max: 100, timeWindow: '1 minute' },
      },
      schema: {
        tags: ['analytics'],
        summary: 'Track an analytics event (no auth required)',
        body: trackEventBodySchema,
        response: { 200: messageResponseSchema },
      },
    },
    analyticsHandler.trackEvent,
  );

  fastify.get(
    '/dashboard',
    {
      config: {
        rateLimit: { max: 20, timeWindow: '1 minute' },
      },
    },
    analyticsHandler.getDashboard,
  );
};
