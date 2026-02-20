import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  integer,
  timestamp,
  date,
  numeric,
  json,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ──────────────────────────────────────────────────────────────────

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "premium",
]);

export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "tool",
]);

export const platformEnum = pgEnum("platform", [
  "recreation_gov",
  "parks_canada",
  "reserve_america",
  "hipcamp",
  "glamping_hub",
  "tentrr",
]);

export const siteTypeEnum = pgEnum("site_type", [
  "tent",
  "rv",
  "cabin",
  "yurt",
  "glamping",
  "backcountry",
  "group",
]);

export const alertStatusEnum = pgEnum("alert_status", [
  "active",
  "paused",
  "triggered",
  "expired",
  "cancelled",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
  "failed",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "availability_alert",
  "booking_confirmation",
  "booking_reminder",
  "alert_expired",
  "system",
]);

// ─── Tables ─────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    image: text("image"),
    emailVerified: boolean("email_verified").default(false).notNull(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    subscriptionTier: subscriptionTierEnum("subscription_tier")
      .default("free")
      .notNull(),
    onboardingCompleted: boolean("onboarding_completed")
      .default(false)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)]
);

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const verifications = pgTable("verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  preferredRegions: json("preferred_regions").$type<string[]>().default([]),
  groupSize: integer("group_size"),
  siteTypes: json("site_types").$type<string[]>().default([]),
  amenityPreferences: json("amenity_preferences")
    .$type<string[]>()
    .default([]),
  budgetMin: numeric("budget_min", { precision: 10, scale: 2 }),
  budgetMax: numeric("budget_max", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  petsAllowed: boolean("pets_allowed").default(false).notNull(),
  accessibilityNeeds: json("accessibility_needs")
    .$type<string[]>()
    .default([]),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  richContent: json("rich_content"),
  toolCalls: json("tool_calls"),
  toolResults: json("tool_results"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const campgrounds = pgTable("campgrounds", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: varchar("external_id", { length: 255 }).notNull(),
  platform: platformEnum("platform").notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description"),
  region: varchar("region", { length: 255 }).notNull(),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 2 }).notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  amenities: json("amenities").$type<string[]>().default([]),
  totalSites: integer("total_sites").default(0).notNull(),
  imageUrl: text("image_url"),
  reservationUrl: text("reservation_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const campsites = pgTable("campsites", {
  id: uuid("id").primaryKey().defaultRandom(),
  campgroundId: uuid("campground_id")
    .notNull()
    .references(() => campgrounds.id, { onDelete: "cascade" }),
  externalId: varchar("external_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  siteType: siteTypeEnum("site_type").notNull(),
  maxOccupancy: integer("max_occupancy").default(1).notNull(),
  amenities: json("amenities").$type<string[]>().default([]),
  pricePerNight: numeric("price_per_night", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  imageUrls: json("image_urls").$type<string[]>().default([]),
  available: boolean("available").default(true).notNull(),
  bookingUrl: text("booking_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  campgroundId: uuid("campground_id")
    .notNull()
    .references(() => campgrounds.id),
  platform: platformEnum("platform").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  siteTypes: json("site_types").$type<string[]>().default([]),
  autoBook: boolean("auto_book").default(false).notNull(),
  confirmFirst: boolean("confirm_first").default(true).notNull(),
  status: alertStatusEnum("status").default("active").notNull(),
  scanIntervalMs: integer("scan_interval_ms").default(300000).notNull(),
  lastScannedAt: timestamp("last_scanned_at", { withTimezone: true }),
  triggeredAt: timestamp("triggered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  alertId: uuid("alert_id").references(() => alerts.id),
  campsiteId: varchar("campsite_id", { length: 255 }).notNull(),
  campsiteName: varchar("campsite_name", { length: 500 }).notNull(),
  campgroundName: varchar("campground_name", { length: 500 }).notNull(),
  platform: platformEnum("platform").notNull(),
  externalBookingId: varchar("external_booking_id", { length: 255 }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalCost: numeric("total_cost", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: bookingStatusEnum("status").default("pending").notNull(),
  bookingUrl: text("booking_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  body: text("body").notNull(),
  data: json("data"),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const pushTokens = pgTable("push_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  platform: text("platform").notNull(), // ios, android, web
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  pushEnabled: boolean("push_enabled").default(true).notNull(),
  emailEnabled: boolean("email_enabled").default(true).notNull(),
  smsEnabled: boolean("sms_enabled").default(false).notNull(),
  quietHoursStart: varchar("quiet_hours_start", { length: 5 }), // HH:mm
  quietHoursEnd: varchar("quiet_hours_end", { length: 5 }), // HH:mm
  timezone: varchar("timezone", { length: 100 }).default("UTC").notNull(),
});

// ─── Relations ──────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
  conversations: many(conversations),
  alerts: many(alerts),
  bookings: many(bookings),
  notifications: many(notifications),
  pushTokens: many(pushTokens),
  notificationPreferences: one(notificationPreferences, {
    fields: [users.id],
    references: [notificationPreferences.userId],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const userPreferencesRelations = relations(
  userPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [userPreferences.userId],
      references: [users.id],
    }),
  })
);

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [conversations.userId],
      references: [users.id],
    }),
    messages: many(messages),
  })
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const campgroundsRelations = relations(campgrounds, ({ many }) => ({
  campsites: many(campsites),
  alerts: many(alerts),
}));

export const campsitesRelations = relations(campsites, ({ one }) => ({
  campground: one(campgrounds, {
    fields: [campsites.campgroundId],
    references: [campgrounds.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one, many }) => ({
  user: one(users, { fields: [alerts.userId], references: [users.id] }),
  campground: one(campgrounds, {
    fields: [alerts.campgroundId],
    references: [campgrounds.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  alert: one(alerts, { fields: [bookings.alertId], references: [alerts.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const pushTokensRelations = relations(pushTokens, ({ one }) => ({
  user: one(users, { fields: [pushTokens.userId], references: [users.id] }),
}));

export const notificationPreferencesRelations = relations(
  notificationPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [notificationPreferences.userId],
      references: [users.id],
    }),
  })
);
