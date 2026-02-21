import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { snipes, platformCredentials } from "../../db/schema/index.js";
import { snipeExecutorQueue } from "../../jobs/queues.js";
import {
  calculateWindowOpensAt,
  calculatePreStageAt,
  supportsSnipeBooking,
} from "./window-calculator.js";
import type { Platform } from "@camper/shared-types";

const MAX_ACTIVE_SNIPES_PER_USER = 5;

export interface CreateSnipeParams {
  userId: string;
  platformCredentialId: string;
  campgroundId: string;
  campgroundName: string;
  platform: Platform;
  arrivalDate: string;
  departureDate: string;
  sitePreferences: string[];
  equipmentType: "tent" | "rv" | "trailer" | "van" | "no_equipment";
  occupants: number;
}

export async function createSnipe(params: CreateSnipeParams) {
  if (!supportsSnipeBooking(params.platform)) {
    throw new Error(`Snipe booking not supported for platform: ${params.platform}`);
  }

  // Verify credential belongs to user
  const credential = await db.query.platformCredentials.findFirst({
    where: and(
      eq(platformCredentials.id, params.platformCredentialId),
      eq(platformCredentials.userId, params.userId),
    ),
  });

  if (!credential) {
    throw new Error("Platform credential not found or does not belong to user");
  }

  // Check active snipe limit
  const activeCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(snipes)
    .where(
      and(
        eq(snipes.userId, params.userId),
        sql`${snipes.status} IN ('scheduled', 'pre_staging', 'executing')`,
      ),
    );

  if ((activeCount[0]?.count ?? 0) >= MAX_ACTIVE_SNIPES_PER_USER) {
    throw new Error(`Maximum ${MAX_ACTIVE_SNIPES_PER_USER} active snipes allowed`);
  }

  // Validate dates
  const arrival = new Date(params.arrivalDate);
  const departure = new Date(params.departureDate);
  if (departure <= arrival) {
    throw new Error("Departure date must be after arrival date");
  }

  // Calculate when the booking window opens
  const windowOpensAt = calculateWindowOpensAt(params.platform, params.arrivalDate);
  const now = new Date();

  if (windowOpensAt < now) {
    throw new Error(
      "Booking window has already opened. Try booking directly instead.",
    );
  }

  // Create the snipe record
  const [snipe] = await db
    .insert(snipes)
    .values({
      userId: params.userId,
      platformCredentialId: params.platformCredentialId,
      campgroundId: params.campgroundId,
      campgroundName: params.campgroundName,
      platform: params.platform,
      arrivalDate: params.arrivalDate,
      departureDate: params.departureDate,
      sitePreferences: params.sitePreferences,
      equipmentType: params.equipmentType,
      occupants: params.occupants,
      windowOpensAt,
      status: "scheduled",
    })
    .returning();

  // Schedule the pre-stage BullMQ job
  const preStageAt = calculatePreStageAt(windowOpensAt);
  const delay = Math.max(0, preStageAt.getTime() - now.getTime());

  await snipeExecutorQueue.add(
    "pre-stage",
    {
      snipeId: snipe!.id,
      phase: "pre_stage" as const,
    },
    {
      jobId: `snipe-prestage-${snipe!.id}`,
      delay,
    },
  );

  return snipe!;
}

export async function listSnipes(userId: string) {
  return db.query.snipes.findMany({
    where: eq(snipes.userId, userId),
    orderBy: [desc(snipes.createdAt)],
  });
}

export async function getSnipe(snipeId: string, userId: string) {
  return db.query.snipes.findFirst({
    where: and(eq(snipes.id, snipeId), eq(snipes.userId, userId)),
  });
}

export async function cancelSnipe(snipeId: string, userId: string) {
  const snipe = await getSnipe(snipeId, userId);
  if (!snipe) {
    throw new Error("Snipe not found");
  }

  if (snipe.status !== "scheduled" && snipe.status !== "pre_staging") {
    throw new Error(`Cannot cancel snipe with status: ${snipe.status}`);
  }

  // Remove the BullMQ jobs
  const preStageJob = await snipeExecutorQueue.getJob(`snipe-prestage-${snipeId}`);
  if (preStageJob) await preStageJob.remove();

  const executeJob = await snipeExecutorQueue.getJob(`snipe-execute-${snipeId}`);
  if (executeJob) await executeJob.remove();

  const [updated] = await db
    .update(snipes)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(eq(snipes.id, snipeId))
    .returning();

  return updated!;
}

export async function updateSnipeStatus(
  snipeId: string,
  status: "scheduled" | "pre_staging" | "executing" | "succeeded" | "failed" | "cancelled",
  extra?: {
    resultBookingId?: string;
    failureReason?: string;
    executedAt?: Date;
  },
) {
  const values: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };

  if (extra?.resultBookingId) values.resultBookingId = extra.resultBookingId;
  if (extra?.failureReason) values.failureReason = extra.failureReason;
  if (extra?.executedAt) values.executedAt = extra.executedAt;

  const [updated] = await db
    .update(snipes)
    .set(values)
    .where(eq(snipes.id, snipeId))
    .returning();

  return updated!;
}
