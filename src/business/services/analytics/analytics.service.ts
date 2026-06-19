import { analyticsRepository } from '@/database/repositories/analytics/analytics.repository';
import { TrackEventInput } from '@/business/lib/validation/analytics';

const trackEvent = async (input: TrackEventInput) => {
  const createdAt = input.timestamp ? new Date(input.timestamp) : new Date();
  return analyticsRepository.create({
    userId: input.userId ?? null,
    event: input.event,
    properties: input.properties as Record<string, unknown>,
    createdAt,
  });
};

const getDashboard = async () => {
  return analyticsRepository.getDashboardData();
};

// Fire-and-forget: never throws, never blocks response
const track = (
  event: string,
  userId?: string | null,
  properties?: Record<string, unknown>,
) => {
  trackEvent({ event, userId, properties: properties ?? {} }).catch(() => {});
};

export const analyticsService = { trackEvent, getDashboard, track };
