import { z } from 'zod';

export const registerPushTokenBodySchema = z.object({
  token: z.string().min(1),
  language: z.enum(['en', 'ru']).optional(),
});

type RegisterPushTokenInput = z.infer<typeof registerPushTokenBodySchema>;

export const unregisterPushTokenBodySchema = z.object({
  token: z.string().min(1),
});

type UnregisterPushTokenInput = z.infer<typeof unregisterPushTokenBodySchema>;

export type { RegisterPushTokenInput, UnregisterPushTokenInput };
