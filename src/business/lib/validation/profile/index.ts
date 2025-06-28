import { z } from 'zod';
import { createResponseWithDataSchema } from '../application';

export const updateProfileBodySchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

export const deleteAvatarResponseSchema = createResponseWithDataSchema(
  z.object({
    message: z.string(),
  }),
);

type UpdateProfileInput = z.infer<typeof updateProfileBodySchema>;
type DeleteAvatarResponse = z.infer<typeof deleteAvatarResponseSchema>;

export type { UpdateProfileInput, DeleteAvatarResponse };
