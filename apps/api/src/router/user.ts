import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { updatePreferencesSchema } from "@camper/shared-types";
import {
  users,
  userPreferences,
  notificationPreferences,
} from "../db/schema/index.js";

export const userRouter = router({
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await ctx.db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, ctx.user.id),
    });

    if (!prefs) {
      // Return defaults
      return {
        id: "",
        userId: ctx.user.id,
        preferredRegions: [],
        groupSize: null,
        siteTypes: [],
        amenityPreferences: [],
        budgetMin: null,
        budgetMax: null,
        currency: "USD" as const,
        petsAllowed: false,
        accessibilityNeeds: [],
      };
    }

    return {
      id: prefs.id,
      userId: prefs.userId,
      preferredRegions: prefs.preferredRegions ?? [],
      groupSize: prefs.groupSize,
      siteTypes: prefs.siteTypes ?? [],
      amenityPreferences: prefs.amenityPreferences ?? [],
      budgetMin: prefs.budgetMin ? parseFloat(prefs.budgetMin) : null,
      budgetMax: prefs.budgetMax ? parseFloat(prefs.budgetMax) : null,
      currency: (prefs.currency as "USD" | "CAD") ?? "USD",
      petsAllowed: prefs.petsAllowed,
      accessibilityNeeds: prefs.accessibilityNeeds ?? [],
    };
  }),

  updatePreferences: protectedProcedure
    .input(updatePreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.userPreferences.findFirst({
        where: eq(userPreferences.userId, ctx.user.id),
      });

      const values: Record<string, unknown> = {};
      if (input.preferredRegions !== undefined) values.preferredRegions = input.preferredRegions;
      if (input.groupSize !== undefined) values.groupSize = input.groupSize;
      if (input.siteTypes !== undefined) values.siteTypes = input.siteTypes;
      if (input.amenityPreferences !== undefined) values.amenityPreferences = input.amenityPreferences;
      if (input.budgetMin !== undefined) values.budgetMin = input.budgetMin != null ? String(input.budgetMin) : null;
      if (input.budgetMax !== undefined) values.budgetMax = input.budgetMax != null ? String(input.budgetMax) : null;
      if (input.currency !== undefined) values.currency = input.currency;
      if (input.petsAllowed !== undefined) values.petsAllowed = input.petsAllowed;
      if (input.accessibilityNeeds !== undefined) values.accessibilityNeeds = input.accessibilityNeeds;

      if (existing) {
        const [updated] = await ctx.db
          .update(userPreferences)
          .set(values)
          .where(eq(userPreferences.userId, ctx.user.id))
          .returning();
        return updated!;
      }

      const [created] = await ctx.db
        .insert(userPreferences)
        .values({
          userId: ctx.user.id,
          ...values,
        })
        .returning();
      return created!;
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        image: z.string().url().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const values: Record<string, unknown> = { updatedAt: new Date() };
      if (input.name !== undefined) values.name = input.name;
      if (input.image !== undefined) values.image = input.image;

      const [updated] = await ctx.db
        .update(users)
        .set(values)
        .where(eq(users.id, ctx.user.id))
        .returning();

      return updated!;
    }),

  getNotificationPreferences: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await ctx.db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, ctx.user.id),
    });

    if (!prefs) {
      return {
        userId: ctx.user.id,
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        quietHoursStart: null,
        quietHoursEnd: null,
        timezone: "UTC",
      };
    }

    return {
      userId: prefs.userId,
      pushEnabled: prefs.pushEnabled,
      emailEnabled: prefs.emailEnabled,
      smsEnabled: prefs.smsEnabled,
      quietHoursStart: prefs.quietHoursStart,
      quietHoursEnd: prefs.quietHoursEnd,
      timezone: prefs.timezone,
    };
  }),

  updateNotificationPreferences: protectedProcedure
    .input(
      z.object({
        pushEnabled: z.boolean().optional(),
        emailEnabled: z.boolean().optional(),
        smsEnabled: z.boolean().optional(),
        quietHoursStart: z.string().nullable().optional(),
        quietHoursEnd: z.string().nullable().optional(),
        timezone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.notificationPreferences.findFirst({
        where: eq(notificationPreferences.userId, ctx.user.id),
      });

      const values: Record<string, unknown> = {};
      if (input.pushEnabled !== undefined) values.pushEnabled = input.pushEnabled;
      if (input.emailEnabled !== undefined) values.emailEnabled = input.emailEnabled;
      if (input.smsEnabled !== undefined) values.smsEnabled = input.smsEnabled;
      if (input.quietHoursStart !== undefined) values.quietHoursStart = input.quietHoursStart;
      if (input.quietHoursEnd !== undefined) values.quietHoursEnd = input.quietHoursEnd;
      if (input.timezone !== undefined) values.timezone = input.timezone;

      if (existing) {
        const [updated] = await ctx.db
          .update(notificationPreferences)
          .set(values)
          .where(eq(notificationPreferences.userId, ctx.user.id))
          .returning();
        return updated!;
      }

      const [created] = await ctx.db
        .insert(notificationPreferences)
        .values({
          userId: ctx.user.id,
          pushEnabled: input.pushEnabled ?? true,
          emailEnabled: input.emailEnabled ?? true,
          smsEnabled: input.smsEnabled ?? false,
          quietHoursStart: input.quietHoursStart ?? null,
          quietHoursEnd: input.quietHoursEnd ?? null,
          timezone: input.timezone ?? "UTC",
        })
        .returning();
      return created!;
    }),
});
