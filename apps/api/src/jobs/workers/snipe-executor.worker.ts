import { Worker, type Job, type ConnectionOptions } from "bullmq";
import Redis from "ioredis";
import { env } from "../../env.js";
import { updateSnipeStatus } from "../../services/snipe/index.js";
import { getDecryptedCredentialById } from "../../services/credential/index.js";
import { sendNotification } from "../../services/notification/index.js";
import { executeBooking, validateLogin, PLATFORM_DOMAINS } from "../../integrations/camply/client.js";
import { snipeExecutorQueue } from "../queues.js";
import { db } from "../../db/index.js";
import { snipes } from "../../db/schema/index.js";
import { eq } from "drizzle-orm";

interface SnipeJobData {
  snipeId: string;
  phase: "pre_stage" | "execute";
  sessionToken?: string;
}

const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
}) as unknown as ConnectionOptions;

const redis = new Redis(env.REDIS_URL);

const SESSION_KEY_PREFIX = "snipe:session:";
const SESSION_TTL = 600; // 10 minutes

/**
 * Snipe executor worker.
 *
 * Two-phase execution:
 * 1. pre_stage: 3 minutes before window opens — authenticate and warm session
 * 2. execute: at exactly windowOpensAt — call sidecar to book
 */
const snipeExecutorWorker = new Worker<SnipeJobData>(
  "snipe-executor",
  async (job: Job<SnipeJobData>) => {
    const { snipeId, phase } = job.data;

    console.log(`[snipe] Processing ${phase} for snipe ${snipeId}`);

    // Load the snipe record
    const snipe = await db.query.snipes.findFirst({
      where: eq(snipes.id, snipeId),
    });

    if (!snipe) {
      throw new Error(`Snipe ${snipeId} not found`);
    }

    if (snipe.status === "cancelled") {
      console.log(`[snipe] Snipe ${snipeId} was cancelled, skipping`);
      return { status: "cancelled" };
    }

    if (phase === "pre_stage") {
      return await handlePreStage(snipe);
    } else {
      return await handleExecute(snipe);
    }
  },
  {
    connection,
    concurrency: 5,
  },
);

async function handlePreStage(snipe: typeof snipes.$inferSelect) {
  await updateSnipeStatus(snipe.id, "pre_staging");

  // Decrypt credentials
  const credData = await getDecryptedCredentialById(snipe.platformCredentialId);
  if (!credData) {
    await updateSnipeStatus(snipe.id, "failed", {
      failureReason: "Platform credentials not found or deleted",
    });
    await notifyFailure(snipe, "Your saved credentials were not found. Please re-add them.");
    return { status: "failed", reason: "credentials_not_found" };
  }

  // Authenticate via sidecar (warm session)
  const domain = PLATFORM_DOMAINS[snipe.platform];
  const loginResult = await validateLogin({
    platform: snipe.platform,
    username: credData.credentials.username,
    password: credData.credentials.password,
    domain,
  });

  if (!loginResult.success) {
    await updateSnipeStatus(snipe.id, "failed", {
      failureReason: `Pre-stage login failed: ${loginResult.error}`,
    });
    await notifyFailure(snipe, `Login failed during pre-staging: ${loginResult.error}`);
    return { status: "failed", reason: "login_failed" };
  }

  // Store session token in Redis
  if (loginResult.session_token) {
    await redis.set(
      `${SESSION_KEY_PREFIX}${snipe.id}`,
      loginResult.session_token,
      "EX",
      SESSION_TTL,
    );
  }

  console.log(`[snipe] Pre-stage complete for ${snipe.id}, scheduling execute`);

  // Schedule the execute phase at exactly windowOpensAt
  const now = Date.now();
  const windowTime = new Date(snipe.windowOpensAt).getTime();
  const executeDelay = Math.max(0, windowTime - now);

  await snipeExecutorQueue.add(
    "execute",
    {
      snipeId: snipe.id,
      phase: "execute" as const,
      sessionToken: loginResult.session_token ?? undefined,
    },
    {
      jobId: `snipe-execute-${snipe.id}`,
      delay: executeDelay,
    },
  );

  return { status: "pre_staged", executeIn: executeDelay };
}

async function handleExecute(snipe: typeof snipes.$inferSelect) {
  await updateSnipeStatus(snipe.id, "executing");

  // Get credentials
  const credData = await getDecryptedCredentialById(snipe.platformCredentialId);
  if (!credData) {
    await updateSnipeStatus(snipe.id, "failed", {
      failureReason: "Credentials not found at execution time",
    });
    await notifyFailure(snipe, "Credentials were not found at booking time.");
    return { status: "failed", reason: "credentials_not_found" };
  }

  const domain = PLATFORM_DOMAINS[snipe.platform];

  // Execute the booking via sidecar
  const result = await executeBooking({
    platform: snipe.platform,
    username: credData.credentials.username,
    password: credData.credentials.password,
    campground_id: snipe.campgroundId,
    site_preferences: snipe.sitePreferences as string[],
    arrival_date: snipe.arrivalDate,
    departure_date: snipe.departureDate,
    equipment_type: snipe.equipmentType,
    occupants: snipe.occupants,
    domain,
  });

  // Clean up session from Redis
  await redis.del(`${SESSION_KEY_PREFIX}${snipe.id}`);

  if (result.success) {
    await updateSnipeStatus(snipe.id, "succeeded", {
      resultBookingId: result.booking_id ?? result.confirmation_number ?? undefined,
      executedAt: new Date(),
    });

    await sendNotification({
      userId: snipe.userId,
      type: "booking_confirmation",
      title: "Campsite booked!",
      body: `Your snipe for ${snipe.campgroundName} succeeded! Site ${result.site_id ?? "reserved"} is booked for ${snipe.arrivalDate} to ${snipe.departureDate}.`,
      data: {
        snipeId: snipe.id,
        siteId: result.site_id,
        bookingId: result.booking_id,
        confirmationNumber: result.confirmation_number,
      },
    });

    console.log(`[snipe] Booking succeeded for snipe ${snipe.id}`);
    return { status: "succeeded", bookingId: result.booking_id };
  } else {
    await updateSnipeStatus(snipe.id, "failed", {
      failureReason: result.error ?? "Booking failed — no sites available",
      executedAt: new Date(),
    });

    await notifyFailure(
      snipe,
      result.error ?? "No preferred sites were available when the window opened.",
    );

    console.log(`[snipe] Booking failed for snipe ${snipe.id}: ${result.error}`);
    return { status: "failed", error: result.error };
  }
}

async function notifyFailure(snipe: typeof snipes.$inferSelect, reason: string) {
  await sendNotification({
    userId: snipe.userId,
    type: "system",
    title: "Snipe booking failed",
    body: `Your snipe for ${snipe.campgroundName} (${snipe.arrivalDate}) failed: ${reason}`,
    data: { snipeId: snipe.id },
  });
}

snipeExecutorWorker.on("completed", (job) => {
  console.log(`[snipe] Job ${job.id} completed`);
});

snipeExecutorWorker.on("failed", (job, error) => {
  console.error(`[snipe] Job ${job?.id} failed:`, error.message);
});

export { snipeExecutorWorker };
