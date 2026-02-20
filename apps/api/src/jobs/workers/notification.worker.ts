import { Worker, type Job, type ConnectionOptions } from "bullmq";
import Redis from "ioredis";
import { env } from "../../env.js";
import { sendNotification, type SendNotificationParams } from "../../services/notification/index.js";

// Cast to resolve ioredis version mismatch between BullMQ's dep and direct dep

interface NotificationJobData {
  userId: string;
  type: SendNotificationParams["type"];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
}) as unknown as ConnectionOptions;

/**
 * Worker that processes notification delivery jobs.
 * Handles push, email, and SMS dispatch through the notification service.
 */
const notificationWorker = new Worker<NotificationJobData>(
  "notifications",
  async (job: Job<NotificationJobData>) => {
    const { userId, type, title, body, data } = job.data;

    console.log(
      `[notifications] Sending ${type} notification to user ${userId}: ${title}`
    );

    await sendNotification({
      userId,
      type,
      title,
      body,
      data,
    });

    console.log(`[notifications] Notification sent to user ${userId}`);
    return { success: true, userId, type };
  },
  {
    connection,
    concurrency: 10,
    limiter: {
      max: 50,
      duration: 1000, // max 50 notifications per second
    },
  }
);

notificationWorker.on("completed", (job) => {
  console.log(`[notifications] Job ${job.id} completed`);
});

notificationWorker.on("failed", (job, error) => {
  console.error(`[notifications] Job ${job?.id} failed:`, error.message);
});

export { notificationWorker };
