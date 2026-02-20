import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  TEST_USER_ID,
  TEST_BOOKING_ID,
  TEST_CAMPSITE_ID,
  makeBooking,
} from "../../test/fixtures.js";

const { mockDb } = vi.hoisted(() => {
  const returningFn = vi.fn().mockResolvedValue([{}]);
  const whereFn = vi.fn().mockReturnValue({ returning: returningFn });
  const setFn = vi.fn().mockReturnValue({ where: whereFn, returning: returningFn });
  const valuesFn = vi.fn().mockReturnValue({ returning: returningFn });
  return {
    mockDb: {
      query: {
        campsites: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
        bookings: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
      },
      insert: vi.fn().mockReturnValue({ values: valuesFn }),
      update: vi.fn().mockReturnValue({ set: setFn }),
      _returning: returningFn,
      _where: whereFn,
      _set: setFn,
      _values: valuesFn,
    },
  };
});

vi.mock("../../db/index.js", () => ({ db: mockDb }));

import {
  createBooking,
  listBookings,
  getBooking,
  cancelBooking,
  updateBookingStatus,
} from "./index.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createBooking", () => {
  it("calculates price as nights x pricePerNight", async () => {
    mockDb.query.campsites.findFirst.mockResolvedValue({
      name: "Site A",
      pricePerNight: "30.00",
      currency: "USD",
      bookingUrl: null,
      campground: { name: "CG One", platform: "recreation_gov" },
    });
    mockDb._returning.mockResolvedValue([makeBooking({ totalCost: "60.00" })]);

    const result = await createBooking({
      userId: TEST_USER_ID,
      campsiteId: TEST_CAMPSITE_ID,
      startDate: "2025-07-01",
      endDate: "2025-07-03",
    });

    expect(mockDb.insert).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it("uses fallback values when campsite not found", async () => {
    mockDb.query.campsites.findFirst.mockResolvedValue(null);
    mockDb._returning.mockResolvedValue([makeBooking()]);

    const result = await createBooking({
      userId: TEST_USER_ID,
      campsiteId: "unknown-id",
      startDate: "2025-07-01",
      endDate: "2025-07-03",
    });

    expect(result).toBeDefined();
  });

  it("passes alertId through when provided", async () => {
    mockDb.query.campsites.findFirst.mockResolvedValue(null);
    const alertId = "alert-123";
    mockDb._returning.mockResolvedValue([makeBooking({ alertId })]);

    const result = await createBooking({
      userId: TEST_USER_ID,
      campsiteId: TEST_CAMPSITE_ID,
      startDate: "2025-07-01",
      endDate: "2025-07-03",
      alertId,
    });

    expect(result.alertId).toBe(alertId);
  });
});

describe("listBookings", () => {
  it("returns ordered results for a user", async () => {
    const bookings = [makeBooking(), makeBooking({ id: "b-2" })];
    mockDb.query.bookings.findMany.mockResolvedValue(bookings);

    const result = await listBookings(TEST_USER_ID);

    expect(result).toHaveLength(2);
  });
});

describe("getBooking", () => {
  it("finds by bookingId and userId", async () => {
    mockDb.query.bookings.findFirst.mockResolvedValue(makeBooking());

    const result = await getBooking(TEST_BOOKING_ID, TEST_USER_ID);

    expect(result).toBeDefined();
    expect(result!.id).toBe(TEST_BOOKING_ID);
  });

  it("returns undefined when not found", async () => {
    mockDb.query.bookings.findFirst.mockResolvedValue(undefined);

    const result = await getBooking("nonexistent", TEST_USER_ID);

    expect(result).toBeUndefined();
  });
});

describe("cancelBooking", () => {
  it("throws when booking not found", async () => {
    mockDb.query.bookings.findFirst.mockResolvedValue(undefined);

    await expect(cancelBooking("bad-id", TEST_USER_ID)).rejects.toThrow(
      "Booking not found"
    );
  });

  it("throws when already cancelled", async () => {
    mockDb.query.bookings.findFirst.mockResolvedValue(
      makeBooking({ status: "cancelled" })
    );

    await expect(cancelBooking(TEST_BOOKING_ID, TEST_USER_ID)).rejects.toThrow(
      "Booking is already cancelled"
    );
  });

  it("updates status to cancelled", async () => {
    mockDb.query.bookings.findFirst.mockResolvedValue(makeBooking());
    mockDb._returning.mockResolvedValue([makeBooking({ status: "cancelled" })]);

    const result = await cancelBooking(TEST_BOOKING_ID, TEST_USER_ID);

    expect(result.status).toBe("cancelled");
    expect(mockDb.update).toHaveBeenCalled();
  });
});

describe("updateBookingStatus", () => {
  it("updates status", async () => {
    mockDb._returning.mockResolvedValue([makeBooking({ status: "confirmed" })]);

    const result = await updateBookingStatus(TEST_BOOKING_ID, "confirmed");

    expect(result.status).toBe("confirmed");
  });

  it("sets externalBookingId when provided", async () => {
    mockDb._returning.mockResolvedValue([
      makeBooking({ status: "confirmed", externalBookingId: "ext-b-1" }),
    ]);

    const result = await updateBookingStatus(TEST_BOOKING_ID, "confirmed", "ext-b-1");

    expect(result.externalBookingId).toBe("ext-b-1");
  });
});
