import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc.js";
import { createSnipeInputSchema } from "@camper/shared-types";
import {
  createSnipe,
  listSnipes,
  getSnipe,
  cancelSnipe,
} from "../services/snipe/index.js";

export const snipeRouter = router({
  create: protectedProcedure
    .input(createSnipeInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const snipe = await createSnipe({
          userId: ctx.user.id,
          ...input,
        });
        return snipe;
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to create snipe",
        });
      }
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return listSnipes(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ snipeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const snipe = await getSnipe(input.snipeId, ctx.user.id);
      if (!snipe) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Snipe not found",
        });
      }
      return snipe;
    }),

  cancel: protectedProcedure
    .input(z.object({ snipeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await cancelSnipe(input.snipeId, ctx.user.id);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to cancel snipe",
        });
      }
    }),
});
