import { timingSafeEqual } from 'crypto';
import { TrackEventInput } from '@/business/lib/validation/analytics';
import { analyticsService } from '@/business/services/analytics/analytics.service';
import { environmentVariables } from '@/config';
import { FastifyReply, FastifyRequest } from 'fastify';

const trackEvent = async (
  req: FastifyRequest<{ Body: TrackEventInput }>,
  reply: FastifyReply,
) => {
  // This endpoint has no required auth (it also carries pre-login events),
  // so a caller-supplied userId in the body can't be trusted - anyone could
  // attribute events to any real user id. Only trust a userId that comes
  // from a cryptographically verified JWT; fall back to null (anonymous
  // event) if there's no token or it doesn't verify.
  let authenticatedUserId: string | null = null;
  try {
    await req.jwtVerify();
    authenticatedUserId = (req.user as { userId: string }).userId ?? null;
  } catch {
    // No/invalid token - anonymous event, that's expected for this route.
  }

  await analyticsService.trackEvent({
    ...req.body,
    userId: authenticatedUserId,
  });
  reply.send({ message: 'ok' });
};

const isValidAnalyticsSecret = (provided: unknown): boolean => {
  const expected = environmentVariables.ANALYTICS_ADMIN_SECRET;
  if (!expected || typeof provided !== 'string') return false;

  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);

  // Buffers must be equal length for timingSafeEqual - compare against a
  // same-length dummy first so a length mismatch doesn't short-circuit
  // and leak length information via timing.
  if (providedBuf.length !== expectedBuf.length) {
    timingSafeEqual(expectedBuf, expectedBuf);
    return false;
  }

  return timingSafeEqual(providedBuf, expectedBuf);
};

const getDashboard = async (req: FastifyRequest, reply: FastifyReply) => {
  if (!isValidAnalyticsSecret(req.headers['x-analytics-secret'])) {
    reply.status(403).send({ message: 'Forbidden' });
    return;
  }

  const data = await analyticsService.getDashboard();
  reply.send({ message: 'ok', data });
};

export const analyticsHandler = { trackEvent, getDashboard };
