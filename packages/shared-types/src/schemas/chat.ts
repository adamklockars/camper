import { z } from "zod";

export const messageRoleSchema = z.enum(["user", "assistant", "tool"]);

export const richContentTypeSchema = z.enum([
  "campsite_card",
  "campsite_list",
  "booking_confirmation",
  "alert_status",
  "quick_actions",
  "error",
]);

export const richContentSchema = z.object({
  type: richContentTypeSchema,
  data: z.record(z.unknown()),
});

export const messageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: messageRoleSchema,
  content: z.string(),
  richContent: z.array(richContentSchema).nullable(),
  toolCalls: z.record(z.unknown()).nullable(),
  toolResults: z.record(z.unknown()).nullable(),
  createdAt: z.date(),
});

export const conversationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const sendMessageInputSchema = z.object({
  conversationId: z.string().optional(),
  content: z.string().min(1).max(4000),
});
