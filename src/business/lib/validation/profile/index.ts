import { z } from 'zod';
import { Currency } from '@prisma/client';

export const updateProfileBodySchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

type UpdateProfileInput = z.infer<typeof updateProfileBodySchema>;

export const updatePasswordBodySchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(1),
});

type UpdatePasswordInput = z.infer<typeof updatePasswordBodySchema>;

export const updateSettingsBodySchema = z.object({
  mainCurrency: z.nativeEnum(Currency),
});

type UpdateSettingsInput = z.infer<typeof updateSettingsBodySchema>;

export type { UpdateProfileInput, UpdatePasswordInput, UpdateSettingsInput };
