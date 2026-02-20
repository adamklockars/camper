import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { sendMessageInputSchema } from "@camper/shared-types";
import { chat } from "../services/ai/index.js";
import { conversations, messages } from "../db/schema/index.js";

export const chatRouter = router({
  sendMessage: protectedProcedure
    .input(sendMessageInputSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await chat(
        ctx.user.id,
        input.content,
        input.conversationId
      );
      return result;
    }),

  getConversations: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;

      const results = await ctx.db.query.conversations.findMany({
        where: eq(conversations.userId, ctx.user.id),
        orderBy: [desc(conversations.updatedAt)],
        limit: limit + 1,
      });

      let nextCursor: string | undefined;
      if (results.length > limit) {
        const last = results.pop()!;
        nextCursor = last.id;
      }

      return {
        conversations: results,
        nextCursor,
      };
    }),

  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        limit: z.number().int().min(1).max(200).default(100),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify the conversation belongs to the user
      const conversation = await ctx.db.query.conversations.findFirst({
        where: and(
          eq(conversations.id, input.conversationId),
          eq(conversations.userId, ctx.user.id)
        ),
      });

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      const results = await ctx.db.query.messages.findMany({
        where: eq(messages.conversationId, input.conversationId),
        orderBy: (m, { asc }) => [asc(m.createdAt)],
        limit: input.limit,
      });

      return {
        messages: results,
      };
    }),

  deleteConversation: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership then delete (cascade will remove messages)
      const conversation = await ctx.db.query.conversations.findFirst({
        where: and(
          eq(conversations.id, input.conversationId),
          eq(conversations.userId, ctx.user.id)
        ),
      });

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      await ctx.db
        .delete(conversations)
        .where(eq(conversations.id, input.conversationId));

      return { success: true };
    }),
});
