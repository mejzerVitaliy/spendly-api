import { z } from "zod";
import { createResponseWithDataSchema } from "../application";
import { TransactionType } from "@prisma/client";

const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  icon: z.string(),
  type: z.nativeEnum(TransactionType),
});

export const getAllCategorioesResponceSchema = createResponseWithDataSchema(
  z.object({
    categories: z.array(categorySchema),
  })
)