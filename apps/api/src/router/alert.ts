import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { createAlertInputSchema } from "@camper/shared-types";
import { alerts } from "../db/schema/index.js";
import { clearAlertCache } from "../services/monitoring/index.js";

export const alertRouter = router({
  create: protectedProcedure
    .input(createAlertInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [alert] = await ctx.db
        .insert(alerts)
        .values({
          userId: ctx.user.id,
          campgroundId: input.campgroundId,
          platform: input.platform,
          startDate: input.startDate,
          endDate: input.endDate,
          siteTypes: input.siteTypes ?? [],
          autoBook: input.autoBook,
          confirmFirst: input.confirmFirst,
          status: "active",
          scanIntervalMs: 300000, // 5 minutes default
        })
        .returning();

      return alert!;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const results = await ctx.db.query.alerts.findMany({
      where: eq(alerts.userId, ctx.user.id),
      orderBy: [desc(alerts.createdAt)],
      with: {
        campground: true,
      },
    });
    return results;
  }),

  get: protectedProcedure
    .input(z.object({ alertId: z.string() }))
    .query(async ({ ctx, input }) => {
      const alert = await ctx.db.query.alerts.findFirst({
        where: and(
          eq(alerts.id, input.alertId),
          eq(alerts.userId, ctx.user.id)
        ),
        with: {
          campground: true,
        },
      });

      if (!alert) {
        throw new Error("Alert not found");
      }

      return alert;
    }),

  pause: protectedProcedure
    .input(z.object({ alertId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const alert = await ctx.db.query.alerts.findFirst({
        where: and(
          eq(alerts.id, input.alertId),
          eq(alerts.userId, ctx.user.id)
        ),
      });

      if (!alert) throw new Error("Alert not found");
      if (alert.status !== "active") {
        throw new Error("Only active alerts can be paused");
      }

      const [updated] = await ctx.db
        .update(alerts)
        .set({ status: "paused", updatedAt: new Date() })
        .where(eq(alerts.id, input.alertId))
        .returning();

      return updated!;
    }),

  resume: protectedProcedure
    .input(z.object({ alertId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const alert = await ctx.db.query.alerts.findFirst({
        where: and(
          eq(alerts.id, input.alertId),
          eq(alerts.userId, ctx.user.id)
        ),
      });

      if (!alert) throw new Error("Alert not found");
      if (alert.status !== "paused") {
        throw new Error("Only paused alerts can be resumed");
      }

      const [updated] = await ctx.db
        .update(alerts)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(alerts.id, input.alertId))
        .returning();

      return updated!;
    }),

  cancel: protectedProcedure
    .input(z.object({ alertId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const alert = await ctx.db.query.alerts.findFirst({
        where: and(
          eq(alerts.id, input.alertId),
          eq(alerts.userId, ctx.user.id)
        ),
      });

      if (!alert) throw new Error("Alert not found");
      if (alert.status === "cancelled") {
        throw new Error("Alert is already cancelled");
      }

      const [updated] = await ctx.db
        .update(alerts)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(alerts.id, input.alertId))
        .returning();

      // Clean up cached availability data
      await clearAlertCache(input.alertId);

      return updated!;
    }),
});
