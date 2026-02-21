import { describe, it, expect } from "vitest";
import {
  snipeStatusSchema,
  equipmentTypeSchema,
  snipeSchema,
  createSnipeInputSchema,
} from "./snipe";

describe("snipeStatusSchema", () => {
  it("accepts all valid statuses", () => {
    const statuses = [
      "scheduled",
      "pre_staging",
      "executing",
      "succeeded",
      "failed",
      "cancelled",
    ];
    for (const s of statuses) {
      expect(snipeStatusSchema.parse(s)).toBe(s);
    }
  });

  it("rejects invalid status", () => {
    expect(() => snipeStatusSchema.parse("pending")).toThrow();
    expect(() => snipeStatusSchema.parse("running")).toThrow();
  });
});

describe("equipmentTypeSchema", () => {
  it("accepts all valid equipment types", () => {
    const types = ["tent", "rv", "trailer", "van", "no_equipment"];
    for (const t of types) {
      expect(equipmentTypeSchema.parse(t)).toBe(t);
    }
  });

  it("rejects invalid equipment type", () => {
    expect(() => equipmentTypeSchema.parse("motorhome")).toThrow();
    expect(() => equipmentTypeSchema.parse("")).toThrow();
  });
});

describe("snipeSchema", () => {
  const validSnipe = {
    id: "snipe-1",
    userId: "user-1",
    platformCredentialId: "cred-1",
    campgroundId: "cg-123",
    campgroundName: "Algonquin Provincial Park",
    platform: "ontario_parks",
    arrivalDate: "2027-08-15",
    departureDate: "2027-08-18",
    sitePreferences: ["site-101", "site-102"],
    equipmentType: "tent",
    occupants: 4,
    windowOpensAt: new Date("2027-03-15T12:00:00Z"),
    status: "scheduled",
    resultBookingId: null,
    failureReason: null,
    executedAt: null,
    createdAt: new Date("2026-12-01"),
    updatedAt: new Date("2026-12-01"),
  };

  it("accepts a valid snipe", () => {
    const result = snipeSchema.parse(validSnipe);
    expect(result.id).toBe("snipe-1");
    expect(result.platform).toBe("ontario_parks");
    expect(result.status).toBe("scheduled");
  });

  it("accepts succeeded snipe with result booking ID", () => {
    const result = snipeSchema.parse({
      ...validSnipe,
      status: "succeeded",
      resultBookingId: "booking-abc",
      executedAt: new Date(),
    });
    expect(result.resultBookingId).toBe("booking-abc");
  });

  it("accepts failed snipe with failure reason", () => {
    const result = snipeSchema.parse({
      ...validSnipe,
      status: "failed",
      failureReason: "No sites available",
      executedAt: new Date(),
    });
    expect(result.failureReason).toBe("No sites available");
  });

  it("rejects missing required fields", () => {
    const { userId, ...rest } = validSnipe;
    expect(() => snipeSchema.parse(rest)).toThrow();
  });

  it("rejects invalid platform", () => {
    expect(() =>
      snipeSchema.parse({ ...validSnipe, platform: "airbnb" }),
    ).toThrow();
  });

  it("rejects invalid status", () => {
    expect(() =>
      snipeSchema.parse({ ...validSnipe, status: "running" }),
    ).toThrow();
  });

  it("rejects invalid equipment type", () => {
    expect(() =>
      snipeSchema.parse({ ...validSnipe, equipmentType: "boat" }),
    ).toThrow();
  });

  it("requires occupants to be at least 1", () => {
    expect(() =>
      snipeSchema.parse({ ...validSnipe, occupants: 0 }),
    ).toThrow();
  });
});

describe("createSnipeInputSchema", () => {
  const validInput = {
    platformCredentialId: "cred-1",
    campgroundId: "cg-123",
    campgroundName: "Algonquin Provincial Park",
    platform: "ontario_parks",
    arrivalDate: "2027-08-15",
    departureDate: "2027-08-18",
    sitePreferences: ["site-101"],
    equipmentType: "tent",
    occupants: 4,
  };

  it("accepts valid create input", () => {
    const result = createSnipeInputSchema.parse(validInput);
    expect(result.platform).toBe("ontario_parks");
    expect(result.sitePreferences).toHaveLength(1);
  });

  it("requires at least one site preference", () => {
    expect(() =>
      createSnipeInputSchema.parse({ ...validInput, sitePreferences: [] }),
    ).toThrow();
  });

  it("rejects occupants > 20", () => {
    expect(() =>
      createSnipeInputSchema.parse({ ...validInput, occupants: 21 }),
    ).toThrow();
  });

  it("rejects occupants < 1", () => {
    expect(() =>
      createSnipeInputSchema.parse({ ...validInput, occupants: 0 }),
    ).toThrow();
  });

  it("accepts all supported platforms", () => {
    for (const platform of ["ontario_parks", "recreation_gov", "parks_canada"]) {
      const result = createSnipeInputSchema.parse({ ...validInput, platform });
      expect(result.platform).toBe(platform);
    }
  });

  it("accepts multiple site preferences", () => {
    const result = createSnipeInputSchema.parse({
      ...validInput,
      sitePreferences: ["site-1", "site-2", "site-3"],
    });
    expect(result.sitePreferences).toHaveLength(3);
  });

  it("rejects missing required fields", () => {
    const { campgroundId, ...rest } = validInput;
    expect(() => createSnipeInputSchema.parse(rest)).toThrow();
  });

  it("accepts all equipment types", () => {
    for (const eq of ["tent", "rv", "trailer", "van", "no_equipment"]) {
      const result = createSnipeInputSchema.parse({ ...validInput, equipmentType: eq });
      expect(result.equipmentType).toBe(eq);
    }
  });
});
