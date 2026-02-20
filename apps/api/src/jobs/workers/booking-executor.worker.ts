import { Worker, type Job, type ConnectionOptions } from "bullmq";
import Redis from "ioredis";
import { eq } from "drizzle-orm";
import { env } from "../../env.js";
import { db } from "../../db/index.js";
import { alerts } from "../../db/schema/index.js";
import { createBooking } from "../../services/booking/index.js";
import { sendNotification } from "../../services/notification/index.js";
import { notificationQueue } from "../queues.js";

interface BookingJobData {
  alertId: string;
  campsiteIds: string[];
}

const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
}) as unknown as ConnectionOptions;

/**
 * Worker that attempts to book campsites when availability is detected.
 */
const bookingWorker = new Worker<BookingJobData>(
  "booking-executor",
  async (job: Job<BookingJobData>) => {
    const { alertId, campsiteIds } = job.data;

    console.log(
      `[booking] Processing booking for alert ${alertId}, ${campsiteIds.length} sites`
    );

    // Look up the alert
    const alert = await db.query.alerts.findFirst({
      where: eq(alerts.id, alertId),
      with: { campground: true },
    });

    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    // Only auto-book if the alert has autoBook enabled
    if (!alert.autoBook) {
      console.log(
        `[booking] Alert ${alertId} does not have auto-book enabled, skipping`
      );
      return { status: "skipped", reason: "auto_book_disabled" };
    }

    // If confirmFirst is true, send a confirmation notification instead
    if (alert.confirmFirst) {
      await sendNotification({
        userId: alert.userId,
        type: "availability_alert",
        title: `Campsite available - confirm booking?`,
        body: `A site at ${alert.campground?.name ?? "your campground"} is available for ${alert.startDate} - ${alert.endDate}. Tap to confirm your booking.`,
        data: {
          alertId: alert.id,
          campsiteIds,
          action: "confirm_booking",
        },
      });

      return { status: "confirmation_sent", campsiteIds };
    }

    // Attempt to create a booking for the first available campsite
    const campsiteId = campsiteIds[0];
    if (!campsiteId) {
      return { status: "no_sites" };
    }

    try {
      const booking = await createBooking({
        userId: alert.userId,
        campsiteId,
        startDate: alert.startDate,
        endDate: alert.endDate,
        alertId: alert.id,
      });

      // Mark alert as triggered
      await db
        .update(alerts)
        .set({
          status: "triggered",
          triggeredAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(alerts.id, alertId));

      // Queue a confirmation notification
      await notificationQueue.add("booking-confirmation", {
        userId: alert.userId,
        type: "booking_confirmation",
        title: "Booking created!",
        body: `Your campsite has been booked for ${alert.startDate} - ${alert.endDate}.`,
        data: { bookingId: booking.id },
      });

      console.log(`[booking] Booking ${booking.id} created for alert ${alertId}`);
      return { status: "booked", bookingId: booking.id };
    } catch (error) {
      console.error(`[booking] Failed to book for alert ${alertId}:`, error);

      await sendNotification({
        userId: alert.userId,
        type: "system",
        title: "Auto-booking failed",
        body: `We found an available site but couldn't complete the booking. Please try manually.`,
        data: {
          alertId: alert.id,
          campsiteIds,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });

      throw error;
    }
  },
  {
    connection,
    concurrency: 2,
  }
);

bookingWorker.on("completed", (job) => {
  console.log(`[booking] Job ${job.id} completed`);
});

bookingWorker.on("failed", (job, error) => {
  console.error(`[booking] Job ${job?.id} failed:`, error.message);
});

export { bookingWorker };
