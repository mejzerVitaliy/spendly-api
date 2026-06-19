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
  }),
);
