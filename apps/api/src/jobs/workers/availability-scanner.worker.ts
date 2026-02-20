import { Worker, type Job, type ConnectionOptions } from "bullmq";
import Redis from "ioredis";
import { env } from "../../env.js";
import {
  scanAlert,
  getAlertsDueForScan,
  expireOldAlerts,
} from "../../services/monitoring/index.js";
import {
  availabilityScannerQueue,
  bookingExecutorQueue,
} from "../queues.js";

interface ScanJobData {
  alertId?: string;
  type?: "schedule_scans";
}

const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
}) as unknown as ConnectionOptions;

/**
 * Schedule scans for all due alerts.
 */
async function scheduleIndividualScans(): Promise<void> {
  const expiredCount = await expireOldAlerts();
  if (expiredCount > 0) {
    console.log(`[scanner] Expired ${expiredCount} alerts`);
  }

  const dueAlerts = await getAlertsDueForScan();
  console.log(`[scanner] ${dueAlerts.length} alerts due for scanning`);

  for (const alert of dueAlerts) {
    await availabilityScannerQueue.add(
      "scan-alert",
      { alertId: alert.id },
      {
        jobId: `scan-${alert.id}-${Date.now()}`,
      }
    );
  }
}

/**
 * Worker that processes both scheduler ticks and individual alert scans.
 */
const scanWorker = new Worker<ScanJobData>(
  "availability-scanner",
  async (job: Job<ScanJobData>) => {
    // Handle scheduler tick
    if (job.data.type === "schedule_scans") {
      console.log("[scanner] Running scan scheduler tick");
      await scheduleIndividualScans();
      return { scheduled: true };
    }

    // Handle individual alert scan
    const { alertId } = job.data;
    if (!alertId) {
      throw new Error("Missing alertId in scan job data");
    }

    console.log(`[scanner] Scanning alert ${alertId}`);
    const result = await scanAlert(alertId);

    console.log(
      `[scanner] Alert ${alertId}: ${result.totalAvailable} available, ${result.newlyAvailable.length} new`
    );

    // If there are newly available sites and auto-book is enabled,
    // queue a booking execution job
    if (result.newlyAvailable.length > 0) {
      await bookingExecutorQueue.add("execute-booking", {
        alertId,
        campsiteIds: result.newlyAvailable,
      });
    }

    return result;
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000, // max 10 jobs per second to avoid rate limiting
    },
  }
);

scanWorker.on("completed", (job) => {
  console.log(`[scanner] Job ${job.id} completed`);
});

scanWorker.on("failed", (job, error) => {
  console.error(`[scanner] Job ${job?.id} failed:`, error.message);
});

/**
 * Start the recurring scheduler that periodically enqueues scan jobs.
 */
export async function startScannerScheduler(): Promise<void> {
  await availabilityScannerQueue.upsertJobScheduler(
    "scan-scheduler",
    { every: 60000 }, // every 60 seconds
    {
      name: "schedule-scans",
      data: { type: "schedule_scans" as const },
    }
  );

  console.log("[scanner] Scheduler started - scanning every 60 seconds");
}

export { scanWorker };
