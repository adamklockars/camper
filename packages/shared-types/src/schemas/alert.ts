import { z } from "zod";
import { platformSchema, siteTypeSchema } from "./campsite";

export const alertStatusSchema = z.enum([
  "active",
  "paused",
  "triggered",
  "expired",
  "cancelled",
]);

export const alertSchema = z.object({
  id: z.string(),
  userId: z.string(),
  campgroundId: z.string(),
  campgroundName: z.string(),
  platform: platformSchema,
  startDate: z.string(),
  endDate: z.string(),
  siteTypes: z.array(siteTypeSchema),
  autoBook: z.boolean(),
  confirmFirst: z.boolean(),
  status: alertStatusSchema,
  scanIntervalMs: z.number().int(),
  lastScannedAt: z.date().nullable(),
  triggeredAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createAlertInputSchema = z.object({
  campgroundId: z.string(),
  platform: platformSchema,
  startDate: z.string(),
  endDate: z.string(),
  siteTypes: z.array(siteTypeSchema).optional(),
  autoBook: z.boolean().default(false),
  confirmFirst: z.boolean().default(true),
});
