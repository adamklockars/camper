import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  TEST_USER_ID,
  TEST_CONVERSATION_ID,
  makeCampsite,
  makeBooking,
} from "../../test/fixtures.js";

const { mockDb, mockSearchCampsites, mockGetCampground, mockGetBooking, mockCancelBooking } =
  vi.hoisted(() => {
    const returningFn = vi.fn().mockResolvedValue([{}]);
    const whereFn = vi.fn().mockReturnValue({ returning: returningFn });
    const setFn = vi.fn().mockReturnValue({ where: whereFn, returning: returningFn });
    const valuesFn = vi.fn().mockReturnValue({ returning: returningFn });
    return {
      mockDb: {
        query: {
          conversations: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
          messages: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
          alerts: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
          userPreferences: { findFirst: vi.fn() },
        },
        insert: vi.fn().mockReturnValue({ values: valuesFn }),
        update: vi.fn().mockReturnValue({ set: setFn }),
        _returning: returningFn,
      },
      mockSearchCampsites: vi.fn(),
      mockGetCampground: vi.fn(),
      mockGetBooking: vi.fn(),
      mockCancelBooking: vi.fn(),
    };
  });

vi.mock("../../db/index.js", () => ({ db: mockDb }));
vi.mock("../campsite/index.js", () => ({
  searchCampsites: (...args: unknown[]) => mockSearchCampsites(...args),
  getCampground: (...args: unknown[]) => mockGetCampground(...args),
}));
vi.mock("../booking/index.js", () => ({
  getBooking: (...args: unknown[]) => mockGetBooking(...args),
  cancelBooking: (...args: unknown[]) => mockCancelBooking(...args),
}));
vi.mock("./tools.js", () => ({ toolDefinitions: [] }));
vi.mock("./prompts.js", () => ({ SYSTEM_PROMPT: "You are a camping assistant." }));
vi.mock("@anthropic-ai/sdk", () => ({ default: vi.fn() }));

import { handleToolCall, extractRichContent, chat } from "./index.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleToolCall", () => {
  it("handles search_campsites", async () => {
    mockSearchCampsites.mockResolvedValue({
      results: [makeCampsite()],
      total: 1,
      page: 1,
      totalPages: 1,
    });

    const result = await handleToolCall("search_campsites", { query: "Yosemite" }, TEST_USER_ID);

    const parsed = JSON.parse(result);
    expect(parsed.results).toHaveLength(1);
  });

  it("handles create_availability_alert", async () => {
    mockDb._returning.mockResolvedValue([{ id: "alert-new" }]);

    const result = await handleToolCall(
      "create_availability_alert",
      {
        campgroundId: "cg-1",
        platform: "recreation_gov",
        startDate: "2025-07-01",
        endDate: "2025-07-05",
      },
      TEST_USER_ID
    );

    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed.alertId).toBe("alert-new");
  });

  it("handles cancel_booking success", async () => {
    mockCancelBooking.mockResolvedValue(makeBooking({ status: "cancelled" }));

    const result = await handleToolCall("cancel_booking", { bookingId: "b-1" }, TEST_USER_ID);

    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
  });

  it("handles cancel_booking error", async () => {
    mockCancelBooking.mockRejectedValue(new Error("Booking not found"));

    const result = await handleToolCall("cancel_booking", { bookingId: "bad" }, TEST_USER_ID);

    const parsed = JSON.parse(result);
    expect(parsed.error).toBe("Booking not found");
  });

  it("handles unknown tool", async () => {
    const result = await handleToolCall("nonexistent_tool", {}, TEST_USER_ID);

    const parsed = JSON.parse(result);
    expect(parsed.error).toContain("Unknown tool");
  });
});

describe("extractRichContent", () => {
  it("returns campsite_list for search with results", () => {
    const toolResult = JSON.stringify({ results: [makeCampsite()], total: 1 });

    const content = extractRichContent("search_campsites", toolResult);

    expect(content).toHaveLength(1);
    expect(content![0].type).toBe("campsite_list");
  });

  it("returns null when search results are empty", () => {
    const content = extractRichContent("search_campsites", JSON.stringify({ results: [], total: 0 }));

    expect(content).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(extractRichContent("search_campsites", "not-json")).toBeNull();
  });

  it("returns alert_status for create_availability_alert", () => {
    const content = extractRichContent(
      "create_availability_alert",
      JSON.stringify({ success: true, alertId: "a-1" })
    );

    expect(content).toHaveLength(1);
    expect(content![0].type).toBe("alert_status");
  });
});

describe("chat", () => {
  it("creates a new conversation when no conversationId", async () => {
    mockDb._returning.mockResolvedValue([{ id: TEST_CONVERSATION_ID }]);
    mockDb.query.messages.findMany.mockResolvedValue([{ role: "user", content: "Hello" }]);

    const result = await chat(TEST_USER_ID, "Hello");

    expect(result.conversationId).toBe(TEST_CONVERSATION_ID);
    expect(result.content).toContain("not available");
  });

  it("returns fallback when no API key configured", async () => {
    mockDb._returning.mockResolvedValue([{ id: TEST_CONVERSATION_ID }]);
    mockDb.query.messages.findMany.mockResolvedValue([]);

    const result = await chat(TEST_USER_ID, "Hello");

    expect(result.content).toContain("ANTHROPIC_API_KEY");
  });
});
