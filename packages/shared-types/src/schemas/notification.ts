import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "availability_alert",
  "booking_confirmation",
  "booking_reminder",
  "alert_expired",
  "system",
]);

export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: notificationTypeSchema,
  title: z.string(),
  body: z.string(),
  data: z.record(z.unknown()).nullable(),
  read: z.boolean(),
  createdAt: z.date(),
});

export const notificationPreferencesSchema = z.object({
  userId: z.string(),
  pushEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  quietHoursStart: z.string().nullable(),
  quietHoursEnd: z.string().nullable(),
  timezone: z.string(),
});
