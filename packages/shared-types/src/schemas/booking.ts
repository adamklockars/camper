import { z } from "zod";
import { platformSchema } from "./campsite";

export const bookingStatusSchema = z.enum([
  "pending",
  "confirmed",
  "cancelled",
  "failed",
]);

export const bookingSchema = z.object({
  id: z.string(),
  userId: z.string(),
  alertId: z.string().nullable(),
  campsiteId: z.string(),
  campsiteName: z.string(),
  campgroundName: z.string(),
  platform: platformSchema,
  externalBookingId: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  totalCost: z.number(),
  currency: z.enum(["USD", "CAD"]),
  status: bookingStatusSchema,
  bookingUrl: z.string().url().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createBookingInputSchema = z.object({
  campsiteId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});
