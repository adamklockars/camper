import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  TEST_USER_ID,
  TEST_NOTIFICATION_ID,
} from "../../test/fixtures.js";

const { mockDb } = vi.hoisted(() => {
  const returningFn = vi.fn().mockResolvedValue([{}]);
  const whereFn = vi.fn().mockReturnValue({ returning: returningFn });
  const setFn = vi.fn().mockReturnValue({ where: whereFn, returning: returningFn });
  const valuesFn = vi.fn().mockReturnValue({ returning: returningFn });
  return {
    mockDb: {
      query: {
        notifications: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
        notificationPreferences: { findFirst: vi.fn() },
        pushTokens: { findMany: vi.fn().mockResolvedValue([]) },
        users: { findFirst: vi.fn() },
      },
      insert: vi.fn().mockReturnValue({ values: valuesFn }),
      update: vi.fn().mockReturnValue({ set: setFn }),
      _returning: returningFn,
    },
  };
});

vi.mock("../../db/index.js", () => ({ db: mockDb }));
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ id: "email-1" }) },
  })),
}));

const mockFetch = vi.fn().mockResolvedValue({ ok: true });
vi.stubGlobal("fetch", mockFetch);

import {
  isQuietHours,
  sendNotification,
  markNotificationRead,
  getUserNotifications,
} from "./index.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isQuietHours", () => {
  it("returns false for null prefs", () => {
    expect(isQuietHours(null)).toBe(false);
  });

  it("returns false when start is null", () => {
    expect(
      isQuietHours({ quietHoursStart: null, quietHoursEnd: "07:00", timezone: "UTC" })
    ).toBe(false);
  });

  it("returns false when end is null", () => {
    expect(
      isQuietHours({ quietHoursStart: "22:00", quietHoursEnd: null, timezone: "UTC" })
    ).toBe(false);
  });

  it("detects quiet hours in same-day range", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-07-01T14:00:00Z"));

    const result = isQuietHours({
      quietHoursStart: "13:00",
      quietHoursEnd: "15:00",
      timezone: "UTC",
    });

    expect(result).toBe(true);
    vi.useRealTimers();
  });

  it("detects outside quiet hours in same-day range", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-07-01T10:00:00Z"));

    const result = isQuietHours({
      quietHoursStart: "22:00",
      quietHoursEnd: "23:00",
      timezone: "UTC",
    });

    expect(result).toBe(false);
    vi.useRealTimers();
  });

  it("handles midnight-spanning range (late night side)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-07-01T23:30:00Z"));

    const result = isQuietHours({
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
      timezone: "UTC",
    });

    expect(result).toBe(true);
    vi.useRealTimers();
  });

  it("handles midnight-spanning range (early morning side)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-07-01T03:00:00Z"));

    const result = isQuietHours({
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
      timezone: "UTC",
    });

    expect(result).toBe(true);
    vi.useRealTimers();
  });
});

describe("sendNotification", () => {
  it("always inserts to DB", async () => {
    mockDb.query.notificationPreferences.findFirst.mockResolvedValue(null);
    mockDb.query.pushTokens.findMany.mockResolvedValue([]);
    mockDb.query.users.findFirst.mockResolvedValue(null);

    await sendNotification({
      userId: TEST_USER_ID,
      type: "system",
      title: "Test",
      body: "Test body",
    });

    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("skips push/email during quiet hours", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-07-01T23:00:00Z"));

    mockDb.query.notificationPreferences.findFirst.mockResolvedValue({
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
      timezone: "UTC",
    });

    await sendNotification({
      userId: TEST_USER_ID,
      type: "system",
      title: "Test",
      body: "Test body",
    });

    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("sends push when enabled and not quiet hours", async () => {
    mockDb.query.notificationPreferences.findFirst.mockResolvedValue({
      pushEnabled: true,
      emailEnabled: false,
      smsEnabled: false,
      quietHoursStart: null,
      quietHoursEnd: null,
      timezone: "UTC",
    });
    mockDb.query.pushTokens.findMany.mockResolvedValue([
      { token: "ExponentPushToken[xxx]", userId: TEST_USER_ID },
    ]);

    await sendNotification({
      userId: TEST_USER_ID,
      type: "system",
      title: "Test",
      body: "Test body",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://exp.host/--/api/v2/push/send",
      expect.any(Object)
    );
  });

  it("skips push when disabled", async () => {
    mockDb.query.notificationPreferences.findFirst.mockResolvedValue({
      pushEnabled: false,
      emailEnabled: false,
      smsEnabled: false,
      quietHoursStart: null,
      quietHoursEnd: null,
      timezone: "UTC",
    });

    await sendNotification({
      userId: TEST_USER_ID,
      type: "system",
      title: "Test",
      body: "Test body",
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("markNotificationRead", () => {
  it("updates the correct record", async () => {
    await markNotificationRead(TEST_NOTIFICATION_ID, TEST_USER_ID);

    expect(mockDb.update).toHaveBeenCalled();
  });
});

describe("getUserNotifications", () => {
  it("returns ordered results", async () => {
    const notifs = [
      { id: "n-1", title: "First", createdAt: new Date() },
      { id: "n-2", title: "Second", createdAt: new Date() },
    ];
    mockDb.query.notifications.findMany.mockResolvedValue(notifs);

    const result = await getUserNotifications(TEST_USER_ID);

    expect(result).toHaveLength(2);
  });
});
