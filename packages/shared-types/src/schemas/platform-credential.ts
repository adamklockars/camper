import { z } from "zod";
import { platformSchema } from "./campsite";

export const platformCredentialSchema = z.object({
  id: z.string(),
  userId: z.string(),
  platform: platformSchema,
  lastValidatedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const savePlatformCredentialInputSchema = z.object({
  platform: platformSchema,
  username: z.string().min(1),
  password: z.string().min(1),
});

export const platformCredentialListItemSchema = z.object({
  id: z.string(),
  platform: platformSchema,
  lastValidatedAt: z.date().nullable(),
  createdAt: z.date(),
});
