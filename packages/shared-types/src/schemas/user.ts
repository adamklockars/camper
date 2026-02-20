import { z } from "zod";
import { siteTypeSchema } from "./campsite";

export const subscriptionTierSchema = z.enum(["free", "premium"]);

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  image: z.string().url().nullable(),
  stripeCustomerId: z.string().nullable(),
  subscriptionTier: subscriptionTierSchema,
  onboardingCompleted: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const userPreferencesSchema = z.object({
  id: z.string(),
  userId: z.string(),
  preferredRegions: z.array(z.string()),
  groupSize: z.number().int().min(1).max(50).nullable(),
  siteTypes: z.array(siteTypeSchema),
  amenityPreferences: z.array(z.string()),
  budgetMin: z.number().nullable(),
  budgetMax: z.number().nullable(),
  currency: z.enum(["USD", "CAD"]),
  petsAllowed: z.boolean(),
  accessibilityNeeds: z.array(z.string()),
});

export const updatePreferencesSchema = userPreferencesSchema
  .omit({ id: true, userId: true })
  .partial();
