import { z } from "zod";

export const successWithoutDataSchema = z.object({
  success: z.boolean(),
});

export const successWithDataSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({ success: z.boolean(), data: schema });
export const errorSchema = z.object({
  message: z.string(),
  status: z.number(),
});

export const failWithErrorSchema = z.object({
  success: z.boolean().default(false),
  error: errorSchema,
});
