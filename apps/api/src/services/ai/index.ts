import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { env } from "../../env.js";
import { db } from "../../db/index.js";
import {
  conversations,
  messages,
  alerts,
  userPreferences,
} from "../../db/schema/index.js";
import { toolDefinitions } from "./tools.js";
import { SYSTEM_PROMPT } from "./prompts.js";
import { searchCampsites, getCampground } from "../campsite/index.js";
import { getBooking, cancelBooking } from "../booking/index.js";
import type { Platform } from "@camper/shared-types";

// Lazy-init: Anthropic SDK validates the API key at construction time.
// In dev without the key, AI chat is a no-op.
let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic | null {
  if (_anthropic) return _anthropic;
  if (!env.ANTHROPIC_API_KEY) return null;
  _anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return _anthropic;
}

const DEFAULT_MODEL = "claude-sonnet-4-6";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResult {
  content: string;
  richContent?: Array<{
    type: string;
    data: Record<string, unknown>;
  }>;
  conversationId: string;
}

/**
 * Handle a tool call from Claude and return the result.
 */
async function handleToolCall(
  toolName: string,
  toolInput: Record<string, unknown>,
  userId: string
): Promise<string> {
  switch (toolName) {
    case "search_campsites": {
      const results = await searchCampsites({
        query: toolInput.query as string | undefined,
        location: toolInput.location as string | undefined,
        latitude: toolInput.latitude as number | undefined,
        longitude: toolInput.longitude as number | undefined,
        radiusMiles: toolInput.radiusMiles as number | undefined,
        startDate: toolInput.startDate as string | undefined,
        endDate: toolInput.endDate as string | undefined,
        siteTypes: toolInput.siteTypes as string[] | undefined,
        groupSize: toolInput.groupSize as number | undefined,
        amenities: toolInput.amenities as string[] | undefined,
        maxPricePerNight: toolInput.maxPricePerNight as number | undefined,
      });
      return JSON.stringify(results);
    }

    case "create_availability_alert": {
      const [alert] = await db
        .insert(alerts)
        .values({
          userId,
          campgroundId: toolInput.campgroundId as string,
          platform: toolInput.platform as Platform,
          startDate: toolInput.startDate as string,
          endDate: toolInput.endDate as string,
          siteTypes: (toolInput.siteTypes as string[]) ?? [],
          autoBook: (toolInput.autoBook as boolean) ?? false,
          confirmFirst: true,
          status: "active",
          scanIntervalMs: 300000, // 5 minutes
        })
        .returning();
      return JSON.stringify({
        success: true,
        alertId: alert!.id,
        message: "Availability alert created. You will be notified when matching sites become available.",
      });
    }

    case "update_user_preferences": {
      const existing = await db.query.userPreferences.findFirst({
        where: eq(userPreferences.userId, userId),
      });

      const values: Record<string, unknown> = {};
      if (toolInput.preferredRegions) values.preferredRegions = toolInput.preferredRegions;
      if (toolInput.groupSize) values.groupSize = toolInput.groupSize;
      if (toolInput.siteTypes) values.siteTypes = toolInput.siteTypes;
      if (toolInput.amenityPreferences) values.amenityPreferences = toolInput.amenityPreferences;
      if (toolInput.budgetMin != null) values.budgetMin = String(toolInput.budgetMin);
      if (toolInput.budgetMax != null) values.budgetMax = String(toolInput.budgetMax);
      if (toolInput.petsAllowed != null) values.petsAllowed = toolInput.petsAllowed;

      if (existing) {
        await db
          .update(userPreferences)
          .set(values)
          .where(eq(userPreferences.userId, userId));
      } else {
        await db.insert(userPreferences).values({
          userId,
          ...values,
        });
      }

      return JSON.stringify({ success: true, message: "Preferences updated." });
    }

    case "get_campground_info": {
      const campground = await getCampground(
        toolInput.platform as Platform,
        toolInput.campgroundId as string
      );
      if (!campground) {
        return JSON.stringify({ error: "Campground not found." });
      }
      return JSON.stringify(campground);
    }

    case "suggest_alternatives": {
      const alternatives = await searchCampsites({
        location: toolInput.location as string,
        startDate: toolInput.startDate as string | undefined,
        endDate: toolInput.endDate as string | undefined,
        siteTypes: toolInput.siteTypes as string[] | undefined,
        maxPricePerNight: toolInput.maxPricePerNight as number | undefined,
        limit: 10,
      });
      return JSON.stringify(alternatives);
    }

    case "get_booking_details": {
      const booking = await getBooking(
        toolInput.bookingId as string,
        userId
      );
      if (!booking) {
        return JSON.stringify({ error: "Booking not found." });
      }
      return JSON.stringify(booking);
    }

    case "cancel_booking": {
      try {
        const cancelled = await cancelBooking(
          toolInput.bookingId as string,
          userId
        );
        return JSON.stringify({
          success: true,
          booking: cancelled,
          message: "Booking cancelled successfully.",
        });
      } catch (error) {
        return JSON.stringify({
          error: error instanceof Error ? error.message : "Failed to cancel booking.",
        });
      }
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

/**
 * Build rich content from the assistant response and tool results.
 */
function extractRichContent(
  toolName: string,
  toolResult: string
): Array<{ type: string; data: Record<string, unknown> }> | null {
  try {
    const parsed = JSON.parse(toolResult);

    switch (toolName) {
      case "search_campsites":
      case "suggest_alternatives":
        if (parsed.results?.length > 0) {
          return [
            {
              type: "campsite_list",
              data: {
                results: parsed.results,
                total: parsed.total,
              },
            },
          ];
        }
        return null;

      case "create_availability_alert":
        if (parsed.success) {
          return [
            {
              type: "alert_status",
              data: { alertId: parsed.alertId, status: "active" },
            },
          ];
        }
        return null;

      case "get_booking_details":
        if (!parsed.error) {
          return [
            {
              type: "booking_confirmation",
              data: parsed,
            },
          ];
        }
        return null;

      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * Send a message in a conversation and get the AI response.
 */
export async function chat(
  userId: string,
  content: string,
  conversationId?: string
): Promise<ChatResult> {
  // Create or retrieve conversation
  let convId = conversationId;
  if (!convId) {
    const [conv] = await db
      .insert(conversations)
      .values({
        userId,
        title: content.substring(0, 100),
      })
      .returning();
    convId = conv!.id;
  }

  // Save user message
  await db.insert(messages).values({
    conversationId: convId,
    role: "user",
    content,
  });

  // Load conversation history
  const history = await db.query.messages.findMany({
    where: eq(messages.conversationId, convId),
    orderBy: (m, { asc }) => [asc(m.createdAt)],
  });

  // Build messages array for Claude
  const claudeMessages: Anthropic.MessageParam[] = history.map((msg) => ({
    role: msg.role === "assistant" ? "assistant" : "user",
    content: msg.content,
  }));

  let richContent: Array<{ type: string; data: Record<string, unknown> }> | undefined;

  const anthropic = getAnthropic();
  if (!anthropic) {
    const fallback = "AI chat is not available — ANTHROPIC_API_KEY is not configured.";
    await db.insert(messages).values({
      conversationId: convId,
      role: "assistant",
      content: fallback,
    });
    return { content: fallback, conversationId: convId };
  }

  // Call Claude API with tool definitions
  let response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: toolDefinitions,
    messages: claudeMessages,
  });

  // Handle tool use loop
  const maxIterations = 10;
  let iteration = 0;

  while (response.stop_reason === "tool_use" && iteration < maxIterations) {
    iteration++;

    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    // Build the tool results
    const toolResultContents: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUseBlocks) {
      const result = await handleToolCall(
        toolUse.name,
        toolUse.input as Record<string, unknown>,
        userId
      );

      // Extract rich content from the first tool result
      if (!richContent) {
        richContent = extractRichContent(toolUse.name, result) ?? undefined;
      }

      toolResultContents.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: result,
      });
    }

    // Continue the conversation with tool results
    claudeMessages.push({
      role: "assistant",
      content: response.content,
    });
    claudeMessages.push({
      role: "user",
      content: toolResultContents,
    });

    response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: toolDefinitions,
      messages: claudeMessages,
    });
  }

  // Extract final text response
  const textBlocks = response.content.filter(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );
  const assistantContent = textBlocks.map((b) => b.text).join("\n");

  // Save assistant message
  await db.insert(messages).values({
    conversationId: convId,
    role: "assistant",
    content: assistantContent,
    richContent: richContent ?? null,
  });

  // Update conversation title if it was just created (use first message as title)
  if (!conversationId) {
    const title =
      content.length > 80 ? content.substring(0, 77) + "..." : content;
    await db
      .update(conversations)
      .set({ title, updatedAt: new Date() })
      .where(eq(conversations.id, convId));
  } else {
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, convId));
  }

  return {
    content: assistantContent,
    richContent,
    conversationId: convId,
  };
}
