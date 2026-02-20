import type { z } from "zod";
import type {
  userSchema,
  userPreferencesSchema,
} from "./schemas/user";
import type {
  normalizedCampsiteSchema,
  campgroundSchema,
  siteTypeSchema,
  platformSchema,
} from "./schemas/campsite";
import type {
  bookingSchema,
  bookingStatusSchema,
} from "./schemas/booking";
import type {
  alertSchema,
  alertStatusSchema,
} from "./schemas/alert";
import type {
  messageSchema,
  conversationSchema,
  richContentSchema,
} from "./schemas/chat";
import type {
  notificationSchema,
  notificationPreferencesSchema,
} from "./schemas/notification";

export type User = z.infer<typeof userSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type NormalizedCampsite = z.infer<typeof normalizedCampsiteSchema>;
export type Campground = z.infer<typeof campgroundSchema>;
export type SiteType = z.infer<typeof siteTypeSchema>;
export type Platform = z.infer<typeof platformSchema>;
export type Booking = z.infer<typeof bookingSchema>;
export type BookingStatus = z.infer<typeof bookingStatusSchema>;
export type Alert = z.infer<typeof alertSchema>;
export type AlertStatus = z.infer<typeof alertStatusSchema>;
export type Message = z.infer<typeof messageSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type RichContent = z.infer<typeof richContentSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
