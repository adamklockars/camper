import "dotenv/config";
import { scanWorker, startScannerScheduler } from "./jobs/workers/availability-scanner.worker.js";
import { bookingWorker } from "./jobs/workers/booking-executor.worker.js";
import { notificationWorker } from "./jobs/workers/notification.worker.js";

async function start() {
  console.log("Starting Camper background workers...");
  console.log(`  [scanner]        ${scanWorker.name} — concurrency 5`);
  console.log(`  [booking]        ${bookingWorker.name} — concurrency 2`);
  console.log(`  [notifications]  ${notificationWorker.name} — concurrency 10`);

  await startScannerScheduler();

  console.log("All workers running. Press Ctrl+C to stop.");
}

// Graceful shutdown
async function shutdown() {
  console.log("\nShutting down workers...");
  await Promise.allSettled([
    scanWorker.close(),
    bookingWorker.close(),
    notificationWorker.close(),
  ]);
  console.log("Workers stopped.");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start().catch((err) => {
  console.error("Failed to start workers:", err);
  process.exit(1);
});
