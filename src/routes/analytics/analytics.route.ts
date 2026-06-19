import { FastifyInstance } from 'fastify';
import { analyticsHandler } from './analytics.handler';
import { trackEventBodySchema } from '@/business/lib/validation/analytics';
import { messageResponseSchema } from '@/business/lib';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 100) return false;
  entry.count++;
  return true;
};

export const analyticsRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    '/event',
    {
      schema: {
        tags: ['analytics'],
        summary: 'Track an analytics event (no auth required)',
        body: trackEventBodySchema,
        response: { 200: messageResponseSchema },
      },
    },
    async (req, reply) => {
      if (!checkRateLimit(req.ip)) {
        reply.status(429).send({ message: 'Too many requests' });
        return;
      }
      return analyticsHandler.trackEvent(req as any, reply);
    },
  );

  fastify.get('/dashboard', analyticsHandler.getDashboard);
};
