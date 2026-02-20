import { describe, it, expect } from "vitest";
import {
  messageRoleSchema,
  richContentTypeSchema,
  sendMessageInputSchema,
  conversationSchema,
} from "./chat";

describe("messageRoleSchema", () => {
  it("accepts all valid roles", () => {
    for (const r of ["user", "assistant", "tool"]) {
      expect(messageRoleSchema.parse(r)).toBe(r);
    }
  });
});

describe("richContentTypeSchema", () => {
  it("accepts all valid types", () => {
    const types = [
      "campsite_card",
      "campsite_list",
      "booking_confirmation",
      "alert_status",
      "quick_actions",
      "error",
    ];
    for (const t of types) {
      expect(richContentTypeSchema.parse(t)).toBe(t);
    }
  });
});

describe("sendMessageInputSchema", () => {
  it("accepts valid input with min length", () => {
    const result = sendMessageInputSchema.parse({ content: "Hi" });
    expect(result.content).toBe("Hi");
    expect(result.conversationId).toBeUndefined();
  });

  it("rejects empty content", () => {
    expect(() => sendMessageInputSchema.parse({ content: "" })).toThrow();
  });

  it("rejects content exceeding max length", () => {
    expect(() =>
      sendMessageInputSchema.parse({ content: "a".repeat(4001) })
    ).toThrow();
  });
});

describe("conversationSchema", () => {
  it("accepts a valid conversation", () => {
    const conv = {
      id: "conv-1",
      userId: "u-1",
      title: "My Trip",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(conversationSchema.parse(conv)).toEqual(conv);
  });
});
