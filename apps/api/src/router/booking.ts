import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";
import { createBookingInputSchema } from "@camper/shared-types";
import {
  createBooking,
  listBookings,
  getBooking,
  cancelBooking,
} from "../services/booking/index.js";

export const bookingRouter = router({
  create: protectedProcedure
    .input(createBookingInputSchema)
    .mutation(async ({ ctx, input }) => {
      const booking = await createBooking({
        userId: ctx.user.id,
        campsiteId: input.campsiteId,
        startDate: input.startDate,
        endDate: input.endDate,
      });
      return booking;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const bookings = await listBookings(ctx.user.id);
    return bookings;
  }),

  get: protectedProcedure
    .input(z.object({ bookingId: z.string() }))
    .query(async ({ ctx, input }) => {
      const booking = await getBooking(input.bookingId, ctx.user.id);
      if (!booking) {
        throw new Error("Booking not found");
      }
      return booking;
    }),

  cancel: protectedProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await cancelBooking(input.bookingId, ctx.user.id);
      return booking;
    }),
});
