import { z } from 'zod';
import { createResponseWithDataSchema } from '../application';
import { Currency } from '@prisma/client';

const passwordSchema = z.string().min(6, {
  message: 'Password must be at least 6 characters long',
});

export const baseUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  avatarUrl: z.string().optional(),
  isTwoFactorEnabled: z.boolean(),
  mainCurrency: z.nativeEnum(Currency),
  totalBalance: z.number(),
});

const userWithPasswordSchema = baseUserSchema.extend({
  password: passwordSchema,
});

const userWithoutPasswordSchema = baseUserSchema;

export const registerBodySchema = userWithPasswordSchema.pick({
  email: true,
  firstName: true,
  lastName: true,
  password: true,
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

export const loginBodySchema = userWithPasswordSchema.pick({
  email: true,
  password: true,
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
};
