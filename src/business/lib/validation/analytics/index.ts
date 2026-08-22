import { z } from 'zod';
import { createResponseWithDataSchema } from '../application';

export const trackEventBodySchema = z.object({
  userId: z.string().uuid().nullable().optional(),
  event: z.string().min(1).max(100),
  properties: z.record(z.unknown()).optional().default({}),
  timestamp: z.number().optional(),
});

export type TrackEventInput = z.infer<typeof trackEventBodySchema>;

export const dashboardResponseSchema = createResponseWithDataSchema(
  z.object({
    dau: z.number(),
    mau: z.number(),
    totalEventsToday: z.number(),
    totalEvents7d: z.number(),
    topEvents: z.array(z.object({ event: z.string(), count: z.number() })),
    dauSeries: z.array(z.object({ date: z.string(), dau: z.number() })),
    eventSeries: z.array(z.object({ date: z.string(), count: z.number() })),
    onboarding: z.object({
      started30d: z.number(),
      completed30d: z.number(),
      completionRatePct: z.number().nullable(),
    }),
    day1Activation: z.object({
      totalSignups: z.number(),
      activated: z.number(),
      ratePct: z.number().nullable(),
    }),
    retention: z.object({
      d1: z.object({
        eligible: z.number(),
        returned: z.number(),
        ratePct: z.number().nullable(),
      }),
      d7: z.object({
        eligible: z.number(),
        returned: z.number(),
        ratePct: z.number().nullable(),
      }),
    }),
    aiAdoption: z.object({
      totalUsers: z.number(),
      adopters: z.number(),
      ratePct: z.number().nullable(),
    }),
  }),
);
