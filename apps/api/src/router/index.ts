import { router } from "../trpc.js";
import { authRouter } from "./auth.js";
import { chatRouter } from "./chat.js";
import { campsiteRouter } from "./campsite.js";
import { bookingRouter } from "./booking.js";
import { alertRouter } from "./alert.js";
import { userRouter } from "./user.js";

export const appRouter = router({
  auth: authRouter,
  chat: chatRouter,
  campsite: campsiteRouter,
  booking: bookingRouter,
  alert: alertRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
