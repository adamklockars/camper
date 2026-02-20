import { Queue, type ConnectionOptions } from "bullmq";
import Redis from "ioredis";
import { env } from "../env.js";

// Cast to ConnectionOptions to resolve ioredis version mismatch between BullMQ's dep and ours
const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
}) as unknown as ConnectionOptions;

export const availabilityScannerQueue = new Queue("availability-scanner", {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

export const bookingExecutorQueue = new Queue("booking-executor", {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 },
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 10000,
    },
  },
});

export const notificationQueue = new Queue("notifications", {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 2000 },
    removeOnFail: { count: 5000 },
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
  },
});

// Export connection for workers to share
export { connection as redisConnection };
