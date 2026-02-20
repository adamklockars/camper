import { describe, it, expect } from "vitest";
import {
  bookingStatusSchema,
  bookingSchema,
  createBookingInputSchema,
} from "./booking";

describe("bookingStatusSchema", () => {
  it("accepts all valid statuses", () => {
    for (const s of ["pending", "confirmed", "cancelled", "failed"]) {
      expect(bookingStatusSchema.parse(s)).toBe(s);
    }
  });

  it("rejects invalid status", () => {
    expect(() => bookingStatusSchema.parse("refunded")).toThrow();
  });
});

describe("bookingSchema", () => {
  const validBooking = {
    id: "b-1",
    userId: "u-1",
    alertId: null,
    campsiteId: "cs-1",
    campsiteName: "Site A",
    campgroundName: "CG One",
    platform: "recreation_gov",
    externalBookingId: null,
    startDate: "2025-07-01",
    endDate: "2025-07-03",
    totalCost: 50,
    currency: "USD",
    status: "pending",
    bookingUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("accepts a valid booking", () => {
    expect(bookingSchema.parse(validBooking)).toEqual(validBooking);
  });

  it("rejects missing userId", () => {
    const { userId, ...rest } = validBooking;
    expect(() => bookingSchema.parse(rest)).toThrow();
  });
});

describe("createBookingInputSchema", () => {
  it("accepts valid input", () => {
    const input = {
      campsiteId: "cs-1",
      startDate: "2025-07-01",
      endDate: "2025-07-03",
    };
    expect(createBookingInputSchema.parse(input)).toEqual(input);
  });

  it("rejects missing required fields", () => {
    expect(() => createBookingInputSchema.parse({ campsiteId: "cs-1" })).toThrow();
  });
});
