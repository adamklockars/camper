import { describe, it, expect } from "vitest";
import {
  alertStatusSchema,
  alertSchema,
  createAlertInputSchema,
} from "./alert";

describe("alertStatusSchema", () => {
  it("accepts all valid statuses", () => {
    for (const s of ["active", "paused", "triggered", "expired", "cancelled"]) {
      expect(alertStatusSchema.parse(s)).toBe(s);
    }
  });
});

describe("alertSchema", () => {
  it("accepts a valid alert", () => {
    const alert = {
      id: "a-1",
      userId: "u-1",
      campgroundId: "cg-1",
      campgroundName: "Test CG",
      platform: "recreation_gov",
      startDate: "2025-07-01",
      endDate: "2025-07-05",
      siteTypes: ["tent"],
      autoBook: false,
      confirmFirst: true,
      status: "active",
      scanIntervalMs: 300000,
      lastScannedAt: null,
      triggeredAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(alertSchema.parse(alert)).toEqual(alert);
  });
});

describe("createAlertInputSchema", () => {
  it("applies defaults for autoBook and confirmFirst", () => {
    const result = createAlertInputSchema.parse({
      campgroundId: "cg-1",
      platform: "recreation_gov",
      startDate: "2025-07-01",
      endDate: "2025-07-05",
    });
    expect(result.autoBook).toBe(false);
    expect(result.confirmFirst).toBe(true);
  });

  it("validates siteTypes array", () => {
    const result = createAlertInputSchema.parse({
      campgroundId: "cg-1",
      platform: "recreation_gov",
      startDate: "2025-07-01",
      endDate: "2025-07-05",
      siteTypes: ["tent", "rv"],
    });
    expect(result.siteTypes).toEqual(["tent", "rv"]);
  });

  it("rejects invalid platform", () => {
    expect(() =>
      createAlertInputSchema.parse({
        campgroundId: "cg-1",
        platform: "invalid_platform",
        startDate: "2025-07-01",
        endDate: "2025-07-05",
      })
    ).toThrow();
  });

  it("requires campgroundId, platform, and dates", () => {
    expect(() => createAlertInputSchema.parse({})).toThrow();
  });
});
