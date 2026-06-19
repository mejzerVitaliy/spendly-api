import { TrackEventInput } from '@/business/lib/validation/analytics';
import { analyticsService } from '@/business/services/analytics/analytics.service';
import { FastifyReply, FastifyRequest } from 'fastify';

const trackEvent = async (
  req: FastifyRequest<{ Body: TrackEventInput }>,
  reply: FastifyReply,
) => {
  await analyticsService.trackEvent(req.body);
  reply.send({ message: 'ok' });
};

const getDashboard = async (req: FastifyRequest, reply: FastifyReply) => {
  const secret = req.headers['x-analytics-secret'];
  const expected = process.env.ANALYTICS_ADMIN_SECRET;

  if (!expected || secret !== expected) {
    reply.status(403).send({ message: 'Forbidden' });
    return;
  }

  const data = await analyticsService.getDashboard();
  reply.send({ message: 'ok', data });
};

export const analyticsHandler = { trackEvent, getDashboard };
