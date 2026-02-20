import { describe, it, expect } from "vitest";
import {
  notificationTypeSchema,
  notificationSchema,
  notificationPreferencesSchema,
} from "./notification";

describe("notificationTypeSchema", () => {
  it("accepts all valid types", () => {
    const types = [
      "availability_alert",
      "booking_confirmation",
      "booking_reminder",
      "alert_expired",
      "system",
    ];
    for (const t of types) {
      expect(notificationTypeSchema.parse(t)).toBe(t);
    }
  });
});

describe("notificationSchema", () => {
  it("accepts a valid notification", () => {
    const notif = {
      id: "n-1",
      userId: "u-1",
      type: "system",
      title: "Welcome",
      body: "Welcome to Camper!",
      data: null,
      read: false,
      createdAt: new Date(),
    };
    expect(notificationSchema.parse(notif)).toEqual(notif);
  });

  it("allows nullable data", () => {
    const notif = {
      id: "n-1",
      userId: "u-1",
      type: "availability_alert",
      title: "Sites available",
      body: "New sites found",
      data: { alertId: "a-1" },
      read: false,
      createdAt: new Date(),
    };
    expect(notificationSchema.parse(notif).data).toEqual({ alertId: "a-1" });
  });
});

describe("notificationPreferencesSchema", () => {
  it("allows nullable quiet hours", () => {
    const prefs = {
      userId: "u-1",
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      quietHoursStart: null,
      quietHoursEnd: null,
      timezone: "UTC",
    };
    expect(notificationPreferencesSchema.parse(prefs)).toEqual(prefs);
  });
});
