import { FastifyRequest } from 'fastify';

// The mobile client sends this on every request (see apiClient/analytics.ts
// in spendly-mobile) so analytics events can be split by platform without
// touching the app's own auth/session model.
export const getPlatform = (req: FastifyRequest): string | undefined => {
  const value = req.headers['x-platform'];
  return typeof value === 'string' ? value : undefined;
};
