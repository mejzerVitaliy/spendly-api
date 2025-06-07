import { z } from 'zod';
import { createResponseWithDataSchema } from '../application';

const passwordSchema = z.string().min(6, {
  message: 'Password must be at least 6 characters long',
});

const baseUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
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
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
);

type LoginResponse = z.infer<typeof loginResponseSchema>;

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
  GetMeResponse,
  RefreshTokenInput,
  RefreshTokenResponse,
};
