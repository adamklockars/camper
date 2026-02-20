import { eq, and } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "../../db/index.js";
import {
  notifications,
  pushTokens,
  notificationPreferences,
  users,
} from "../../db/schema/index.js";
import { env } from "../../env.js";

// Lazy-init: Resend requires an API key at construction time.
// In dev without the key, email sending is a no-op.
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export interface SendNotificationParams {
  userId: string;
  type:
    | "availability_alert"
    | "booking_confirmation"
    | "booking_reminder"
    | "alert_expired"
    | "system";
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Check whether the current time falls within a user's quiet hours.
 */
export function isQuietHours(
  prefs: {
    quietHoursStart: string | null;
    quietHoursEnd: string | null;
    timezone: string;
  } | null
): boolean {
  if (!prefs?.quietHoursStart || !prefs?.quietHoursEnd) return false;

  try {
    const now = new Date();
    // Convert current time to user's timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: prefs.timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(
      parts.find((p) => p.type === "hour")?.value ?? "0",
      10
    );
    const minute = parseInt(
      parts.find((p) => p.type === "minute")?.value ?? "0",
      10
    );

    const currentMinutes = hour * 60 + minute;
    const [startH, startM] = prefs.quietHoursStart.split(":").map(Number);
    const [endH, endM] = prefs.quietHoursEnd.split(":").map(Number);
    const startMinutes = startH! * 60 + startM!;
    const endMinutes = endH! * 60 + endM!;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
    // Quiet hours span midnight
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } catch {
    return false;
  }
}

/**
 * Send a notification to a user across all enabled channels.
 * Respects notification preferences and quiet hours.
 */
export async function sendNotification(
  params: SendNotificationParams
): Promise<void> {
  const { userId, type, title, body, data } = params;

  // Always store the notification in the database
  await db.insert(notifications).values({
    userId,
    type,
    title,
    body,
    data: data ?? null,
    read: false,
  });

  // Look up user preferences
  const prefs = await db.query.notificationPreferences.findFirst({
    where: eq(notificationPreferences.userId, userId),
  });

  // Check quiet hours (skip push/email/sms during quiet hours but still save)
  if (isQuietHours(prefs ?? null)) {
    return;
  }

  // Send via enabled channels in parallel
  const tasks: Promise<void>[] = [];

  if (!prefs || prefs.pushEnabled) {
    tasks.push(sendPushNotification(userId, title, body, data));
  }

  if (!prefs || prefs.emailEnabled) {
    tasks.push(sendEmailNotification(userId, title, body));
  }

  if (prefs?.smsEnabled) {
    tasks.push(sendSmsNotification(userId, title, body));
  }

  await Promise.allSettled(tasks);
}

/**
 * Send push notifications via Expo push service.
 */
async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const tokens = await db.query.pushTokens.findMany({
    where: eq(pushTokens.userId, userId),
  });

  if (tokens.length === 0) return;

  const messages = tokens.map((t) => ({
    to: t.token,
    sound: "default" as const,
    title,
    body,
    data: data ?? {},
  }));

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });
  } catch (error) {
    console.error("Failed to send push notification:", error);
  }
}

/**
 * Send an email notification via Resend.
 */
async function sendEmailNotification(
  userId: string,
  title: string,
  body: string
): Promise<void> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user?.email || !resend) return;

  try {
    await resend.emails.send({
      from: "Camper <notifications@camper.app>",
      to: user.email,
      subject: title,
      text: body,
    });
  } catch (error) {
    console.error("Failed to send email notification:", error);
  }
}

/**
 * Send an SMS notification. Placeholder for Twilio integration.
 */
async function sendSmsNotification(
  _userId: string,
  _title: string,
  _body: string
): Promise<void> {
  // Twilio integration placeholder.
  // Would look up user phone number and send via Twilio API.
  console.warn("SMS notifications not yet implemented (Twilio pending)");
}

/**
 * Mark a notification as read.
 */
export async function markNotificationRead(
  notificationId: string,
  userId: string
): Promise<void> {
  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    );
}

/**
 * Get notifications for a user.
 */
export async function getUserNotifications(
  userId: string,
  limit = 50,
  unreadOnly = false
) {
  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) {
    conditions.push(eq(notifications.read, false));
  }

  return db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: (n, { desc }) => [desc(n.createdAt)],
    limit,
  });
}
