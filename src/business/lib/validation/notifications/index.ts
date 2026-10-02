import { z } from 'zod';
import { createResponseWithDataSchema } from '../application';

export const registerPushTokenBodySchema = z.object({
  token: z.string().min(1),
  language: z.enum(['en', 'ru']).optional(),
});

type RegisterPushTokenInput = z.infer<typeof registerPushTokenBodySchema>;

export const unregisterPushTokenBodySchema = z.object({
  token: z.string().min(1),
});

type UnregisterPushTokenInput = z.infer<typeof unregisterPushTokenBodySchema>;

// hourUtc/minuteUtc are always sent, even while disabling - the picker on
// the client always has a value, so there's no need for a nullable "clear"
// state; disabling just stops dispatch from reading it, the stored time is
// kept so turning it back on remembers the last pick.
export const updateReminderSettingsBodySchema = z.object({
  enabled: z.boolean(),
  hourUtc: z.number().int().min(0).max(23),
  minuteUtc: z.number().int().min(0).max(59),
});

type UpdateReminderSettingsInput = z.infer<
  typeof updateReminderSettingsBodySchema
>;

const reminderSettingsSchema = z.object({
  enabled: z.boolean(),
  hourUtc: z.number().int().min(0).max(23).nullable(),
  minuteUtc: z.number().int().min(0).max(59).nullable(),
});

export const reminderSettingsResponseSchema = createResponseWithDataSchema(
  reminderSettingsSchema,
);

const notificationHistoryItemSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  titleKey: z.string(),
  bodyKey: z.string(),
  bodyParams: z.record(z.union([z.string(), z.number()])).nullable(),
  createdAt: z.string(),
});

export const notificationHistoryResponseSchema = createResponseWithDataSchema(
  z.array(notificationHistoryItemSchema),
);

export type {
  RegisterPushTokenInput,
  UnregisterPushTokenInput,
  UpdateReminderSettingsInput,
};
