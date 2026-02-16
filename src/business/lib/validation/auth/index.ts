import { z } from 'zod';
import { createResponseWithDataSchema } from '../application';

const passwordSchema = z.string().min(6, {
  message: 'Password must be at least 6 characters long',
});

const userTypeSchema = z.enum(['GUEST', 'REGISTERED']);

export const baseUserSchema = z.object({
  id: z.string().uuid(),
  type: userTypeSchema,
  email: z.string().email().nullable().optional(),
  avatarUrl: z.string().nullable(),
  isTwoFactorEnabled: z.boolean(),
  mainCurrencyCode: z.string().length(3),
  totalBalance: z.number(),
  onboardingCompleted: z.boolean(),
});

const userWithPasswordSchema = baseUserSchema.extend({
  password: passwordSchema,
});

const userWithoutPasswordSchema = baseUserSchema;

export const registerBodySchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
});

type RegisterInput = z.infer<typeof registerBodySchema>;

export const registerResponseSchema = createResponseWithDataSchema(
  z.object({
    user: userWithoutPasswordSchema,
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
);

type RegisterResponse = z.infer<typeof registerResponseSchema>;

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
});

type LoginInput = z.infer<typeof loginBodySchema>;

export const loginResponseSchema = createResponseWithDataSchema(
  z.object({
    user: userWithoutPasswordSchema,
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
  }),
);

type LoginResponse = z.infer<typeof loginResponseSchema>;

export const loginTwoFactorBodySchema = z.object({
  email: z.string().email(),
  code: z.string(),
});

type LoginTwoFactorInput = z.infer<typeof loginTwoFactorBodySchema>;

export const loginTwoFactorResendBodySchema = z.object({
  email: z.string().email(),
});

type LoginTwoFactorResendInput = z.infer<typeof loginTwoFactorResendBodySchema>;

export const loginTwoFactorResponseSchema = createResponseWithDataSchema(
  z.object({
    user: userWithoutPasswordSchema,
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
);

type LoginTwoFactorResponse = z.infer<typeof loginTwoFactorResponseSchema>;

export const getMeResponseSchema = createResponseWithDataSchema(
  userWithoutPasswordSchema,
);

type GetMeResponse = z.infer<typeof getMeResponseSchema>;

export const refreshTokenBodySchema = z.object({
  refreshToken: z.string(),
});

type RefreshTokenInput = z.infer<typeof refreshTokenBodySchema>;

export const refreshTokenResponseSchema = createResponseWithDataSchema(
  z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
);

type RefreshTokenResponse = z.infer<typeof refreshTokenResponseSchema>;

export const guestBodySchema = z.object({
  mainCurrencyCode: z.string().length(3),
  favoriteCategories: z.array(z.string().uuid()).min(1),
  walletInitialBalance: z.number().int().optional().default(0),
});

type GuestInput = z.infer<typeof guestBodySchema>;

export const guestResponseSchema = createResponseWithDataSchema(
  z.object({
    user: baseUserSchema,
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
);

type GuestResponse = z.infer<typeof guestResponseSchema>;

export const upgradeGuestBodySchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
});

type UpgradeGuestInput = z.infer<typeof upgradeGuestBodySchema>;

export const upgradeGuestResponseSchema = createResponseWithDataSchema(
  z.object({
    user: baseUserSchema,
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
);

type UpgradeGuestResponse = z.infer<typeof upgradeGuestResponseSchema>;

export {
  RegisterInput,
  RegisterResponse,
  LoginInput,
  LoginResponse,
  LoginTwoFactorInput,
  LoginTwoFactorResponse,
  GetMeResponse,
  RefreshTokenInput,
  RefreshTokenResponse,
  LoginTwoFactorResendInput,
  GuestInput,
  GuestResponse,
  UpgradeGuestInput,
  UpgradeGuestResponse,
};
