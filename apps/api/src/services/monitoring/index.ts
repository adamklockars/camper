import { eq, and, lte } from "drizzle-orm";
import Redis from "ioredis";
import { db } from "../../db/index.js";
import { alerts } from "../../db/schema/index.js";
import { checkAvailability } from "../campsite/index.js";
import { sendNotification } from "../notification/index.js";
import { env } from "../../env.js";
import type { Platform } from "@camper/shared-types";

const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

const AVAILABILITY_CACHE_PREFIX = "availability:";
const CACHE_TTL_SECONDS = 300; // 5 minutes

export interface ScanResult {
  alertId: string;
  newlyAvailable: string[]; // campsite IDs that became available
  totalAvailable: number;
}

/**
 * Scan for availability changes for a single alert.
 */
export async function scanAlert(alertId: string): Promise<ScanResult> {
  const alert = await db.query.alerts.findFirst({
    where: eq(alerts.id, alertId),
    with: { campground: true },
  });

  if (!alert || alert.status !== "active") {
    return { alertId, newlyAvailable: [], totalAvailable: 0 };
  }

  const platform = alert.platform as Platform;
  const campgroundExternalId = alert.campground?.externalId ?? alert.campgroundId;

  // Fetch current availability from the platform
  const availability = await checkAvailability(
    platform,
    campgroundExternalId,
    alert.startDate,
    alert.endDate
  );

  const availableSites = availability.filter((a) => a.available);

  // Filter by preferred site types if set
  // (Site type filtering would require site metadata -- for now return all available)

  // Compare with cached results to find newly available sites
  const cacheKey = `${AVAILABILITY_CACHE_PREFIX}${alertId}`;
  const cachedRaw = await redis.get(cacheKey);
  const previouslyAvailable: Set<string> = cachedRaw
    ? new Set(JSON.parse(cachedRaw) as string[])
    : new Set();

  const currentAvailableIds = availableSites.map((s) => s.campsiteId);
  const newlyAvailable = currentAvailableIds.filter(
    (id) => !previouslyAvailable.has(id)
  );

  // Update cache
  await redis.set(
    cacheKey,
    JSON.stringify(currentAvailableIds),
    "EX",
    CACHE_TTL_SECONDS
  );

  // Update last scanned timestamp
  await db
    .update(alerts)
    .set({ lastScannedAt: new Date(), updatedAt: new Date() })
    .where(eq(alerts.id, alertId));

  // If there are newly available sites, trigger notification
  if (newlyAvailable.length > 0) {
    await db
      .update(alerts)
      .set({
        triggeredAt: new Date(),
        status: alert.autoBook ? "triggered" : "active",
        updatedAt: new Date(),
      })
      .where(eq(alerts.id, alertId));

    await sendNotification({
      userId: alert.userId,
      type: "availability_alert",
      title: `Sites available at ${alert.campground?.name ?? "campground"}!`,
      body: `${newlyAvailable.length} new campsite(s) are now available for your dates (${alert.startDate} - ${alert.endDate}).`,
      data: {
        alertId: alert.id,
        campgroundId: alert.campgroundId,
        newlyAvailable,
        startDate: alert.startDate,
        endDate: alert.endDate,
      },
    });
  }

  return {
    alertId,
    newlyAvailable,
    totalAvailable: availableSites.length,
  };
}

/**
 * Get all active alerts that are due for scanning.
 */
export async function getAlertsDueForScan(): Promise<
  Array<{ id: string; scanIntervalMs: number }>
> {
  const now = new Date();

  const activeAlerts = await db.query.alerts.findMany({
    where: eq(alerts.status, "active"),
    columns: {
      id: true,
      scanIntervalMs: true,
      lastScannedAt: true,
    },
  });

  return activeAlerts.filter((alert) => {
    if (!alert.lastScannedAt) return true;
    const nextScanTime = new Date(
      alert.lastScannedAt.getTime() + alert.scanIntervalMs
    );
    return now >= nextScanTime;
  });
}

/**
 * Expire alerts whose end date has passed.
 */
export async function expireOldAlerts(): Promise<number> {
  const today = new Date().toISOString().split("T")[0]!;

  const result = await db
    .update(alerts)
    .set({ status: "expired", updatedAt: new Date() })
    .where(and(eq(alerts.status, "active"), lte(alerts.endDate, today)))
    .returning({ id: alerts.id });

  for (const alert of result) {
    await sendNotification({
      userId: alert.id,
      type: "alert_expired",
      title: "Availability alert expired",
      body: "Your campsite availability alert has expired because the end date has passed.",
      data: { alertId: alert.id },
    });
  }

  return result.length;
}

/**
 * Clear availability cache for an alert (e.g., when cancelled).
 */
export async function clearAlertCache(alertId: string): Promise<void> {
  await redis.del(`${AVAILABILITY_CACHE_PREFIX}${alertId}`);
}
