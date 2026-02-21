import { z } from "zod";
import { platformSchema, siteTypeSchema } from "./campsite";

export const snipeStatusSchema = z.enum([
  "scheduled",
  "pre_staging",
  "executing",
  "succeeded",
  "failed",
  "cancelled",
]);

export const equipmentTypeSchema = z.enum([
  "tent",
  "rv",
  "trailer",
  "van",
  "no_equipment",
]);

export const snipeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  platformCredentialId: z.string(),
  campgroundId: z.string(),
  campgroundName: z.string(),
  platform: platformSchema,
  arrivalDate: z.string(),
  departureDate: z.string(),
  sitePreferences: z.array(z.string()),
  equipmentType: equipmentTypeSchema,
  occupants: z.number().int().min(1),
  windowOpensAt: z.date(),
  status: snipeStatusSchema,
  resultBookingId: z.string().nullable(),
  failureReason: z.string().nullable(),
  executedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createSnipeInputSchema = z.object({
  platformCredentialId: z.string(),
  campgroundId: z.string(),
  campgroundName: z.string(),
  platform: platformSchema,
  arrivalDate: z.string(),
  departureDate: z.string(),
  sitePreferences: z.array(z.string()).min(1),
  equipmentType: equipmentTypeSchema,
  occupants: z.number().int().min(1).max(20),
});
