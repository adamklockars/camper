import { router } from "../trpc.js";
import { authRouter } from "./auth.js";
import { chatRouter } from "./chat.js";
import { campsiteRouter } from "./campsite.js";
import { bookingRouter } from "./booking.js";
import { alertRouter } from "./alert.js";
import { userRouter } from "./user.js";
import { snipeRouter } from "./snipe.js";
import { credentialRouter } from "./credential.js";

export const appRouter = router({
  auth: authRouter,
  chat: chatRouter,
  campsite: campsiteRouter,
  booking: bookingRouter,
  alert: alertRouter,
  user: userRouter,
  snipe: snipeRouter,
  credential: credentialRouter,
});

export type AppRouter = typeof appRouter;
