import { z, ZodSchema } from 'zod';

export const createResponseWithDataSchema = <T extends ZodSchema>(
  dataSchema: T,
) =>
  z.object({
    message: z.string(),
    data: dataSchema,
  });

export const messageResponseSchema = z.object({
  message: z.string(),
});

type MessageResponse = z.infer<typeof messageResponseSchema>;

export type { MessageResponse };
