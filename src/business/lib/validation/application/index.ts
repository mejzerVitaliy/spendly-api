import { z, ZodSchema } from "zod";

export const createResponseWithDataSchema = <T extends ZodSchema>(
  dataSchema: T
) =>
  z.object({
    message: z.string(),
    data: dataSchema,
  });

export const messageResponseSchema = z.object({
  message: z.string(),
});

type MessageResponse = z.infer<typeof messageResponseSchema>;

export const idParamsSchema = z.object({
  id: z.string().uuid(),
});

type IdInput = z.infer<typeof idParamsSchema>;

export type {
  MessageResponse,
  IdInput
}