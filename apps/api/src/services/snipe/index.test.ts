import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  TEST_USER_ID,
  TEST_SNIPE_ID,
  TEST_CREDENTIAL_ID,
  makeSnipe,
} from "../../test/fixtures.js";

const mockQueueAdd = vi.fn().mockResolvedValue({});
const mockQueueGetJob = vi.fn().mockResolvedValue(null);

const { mockDb } = vi.hoisted(() => {
  const returningFn = vi.fn().mockResolvedValue([{}]);
  const whereFn = vi.fn().mockReturnValue({ returning: returningFn });
  const setFn = vi.fn().mockReturnValue({ where: whereFn, returning: returningFn });
  const valuesFn = vi.fn().mockReturnValue({ returning: returningFn });
  const selectFromWhere = vi.fn().mockResolvedValue([{ count: 0 }]);
  const selectFrom = vi.fn().mockReturnValue({ where: selectFromWhere });

  return {
    mockDb: {
      query: {
        platformCredentials: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
        snipes: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
      },
      insert: vi.fn().mockReturnValue({ values: valuesFn }),
      update: vi.fn().mockReturnValue({ set: setFn }),
      select: vi.fn().mockReturnValue({ from: selectFrom }),
      _returning: returningFn,
      _where: whereFn,
      _set: setFn,
      _values: valuesFn,
      _selectFromWhere: selectFromWhere,
    },
  };
});

vi.mock("../../db/index.js", () => ({ db: mockDb }));
vi.mock("../../db/schema/index.js", () => ({
  snipes: {
    id: "id",
    userId: "user_id",
    platformCredentialId: "platform_credential_id",
    campgroundId: "campground_id",
    campgroundName: "campground_name",
    platform: "platform",
    arrivalDate: "arrival_date",
    departureDate: "departure_date",
    sitePreferences: "site_preferences",
    equipmentType: "equipment_type",
    occupants: "occupants",
    windowOpensAt: "window_opens_at",
    status: "status",
    resultBookingId: "result_booking_id",
    failureReason: "failure_reason",
    executedAt: "executed_at",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  platformCredentials: {
    id: "id",
    userId: "user_id",
    platform: "platform",
  },
}));
vi.mock("../../jobs/queues.js", () => ({
  snipeExecutorQueue: {
    add: (...args: unknown[]) => mockQueueAdd(...args),
    getJob: (...args: unknown[]) => mockQueueGetJob(...args),
  },
}));

import {
  createSnipe,
  listSnipes,
  getSnipe,
  cancelSnipe,
  updateSnipeStatus,
} from "./index.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createSnipe", () => {
  const validParams = {
    userId: TEST_USER_ID,
    platformCredentialId: TEST_CREDENTIAL_ID,
    campgroundId: "cg-algonquin-123",
    campgroundName: "Algonquin Provincial Park",
    platform: "ontario_parks" as const,
    arrivalDate: "2027-08-15",
    departureDate: "2027-08-18",
    sitePreferences: ["site-101", "site-102"],
    equipmentType: "tent" as const,
    occupants: 4,
  };

  it("creates a snipe and schedules a BullMQ job", async () => {
    const snipe = makeSnipe();
    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce({
      id: TEST_CREDENTIAL_ID,
      userId: TEST_USER_ID,
    });
    mockDb._selectFromWhere.mockResolvedValueOnce([{ count: 0 }]);
    mockDb._returning.mockResolvedValueOnce([snipe]);

    const result = await createSnipe(validParams);

    expect(result.id).toBe(TEST_SNIPE_ID);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockQueueAdd).toHaveBeenCalledWith(
      "pre-stage",
      expect.objectContaining({
        snipeId: TEST_SNIPE_ID,
        phase: "pre_stage",
      }),
      expect.objectContaining({
        jobId: `snipe-prestage-${TEST_SNIPE_ID}`,
      }),
    );
  });

  it("throws when platform does not support snipe booking", async () => {
    await expect(
      createSnipe({ ...validParams, platform: "hipcamp" as any }),
    ).rejects.toThrow("not supported");
  });

  it("throws when credential not found", async () => {
    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce(null);

    await expect(createSnipe(validParams)).rejects.toThrow(
      "Platform credential not found",
    );
  });

  it("throws when max active snipes exceeded", async () => {
    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce({
      id: TEST_CREDENTIAL_ID,
      userId: TEST_USER_ID,
    });
    mockDb._selectFromWhere.mockResolvedValueOnce([{ count: 5 }]);

    await expect(createSnipe(validParams)).rejects.toThrow("Maximum 5 active snipes");
  });

  it("throws when departure is before arrival", async () => {
    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce({
      id: TEST_CREDENTIAL_ID,
      userId: TEST_USER_ID,
    });
    mockDb._selectFromWhere.mockResolvedValueOnce([{ count: 0 }]);

    await expect(
      createSnipe({
        ...validParams,
        arrivalDate: "2027-08-18",
        departureDate: "2027-08-15",
      }),
    ).rejects.toThrow("Departure date must be after arrival date");
  });

  it("throws when departure equals arrival", async () => {
    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce({
      id: TEST_CREDENTIAL_ID,
      userId: TEST_USER_ID,
    });
    mockDb._selectFromWhere.mockResolvedValueOnce([{ count: 0 }]);

    await expect(
      createSnipe({
        ...validParams,
        arrivalDate: "2027-08-15",
        departureDate: "2027-08-15",
      }),
    ).rejects.toThrow("Departure date must be after arrival date");
  });

  it("throws when booking window has already passed", async () => {
    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce({
      id: TEST_CREDENTIAL_ID,
      userId: TEST_USER_ID,
    });
    mockDb._selectFromWhere.mockResolvedValueOnce([{ count: 0 }]);

    // Use a past date that would have a window in the past
    await expect(
      createSnipe({
        ...validParams,
        arrivalDate: "2024-01-15",
        departureDate: "2024-01-18",
      }),
    ).rejects.toThrow("Booking window has already opened");
  });

  it("works with recreation_gov platform", async () => {
    const snipe = makeSnipe({ platform: "recreation_gov" });
    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce({
      id: TEST_CREDENTIAL_ID,
      userId: TEST_USER_ID,
    });
    mockDb._selectFromWhere.mockResolvedValueOnce([{ count: 0 }]);
    mockDb._returning.mockResolvedValueOnce([snipe]);

    const result = await createSnipe({
      ...validParams,
      platform: "recreation_gov",
    });

    expect(result).toBeDefined();
    expect(mockQueueAdd).toHaveBeenCalled();
  });

  it("works with parks_canada platform", async () => {
    const snipe = makeSnipe({ platform: "parks_canada" });
    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce({
      id: TEST_CREDENTIAL_ID,
      userId: TEST_USER_ID,
    });
    mockDb._selectFromWhere.mockResolvedValueOnce([{ count: 0 }]);
    mockDb._returning.mockResolvedValueOnce([snipe]);

    const result = await createSnipe({
      ...validParams,
      platform: "parks_canada",
    });

    expect(result).toBeDefined();
  });
});

describe("listSnipes", () => {
  it("returns snipes for a user", async () => {
    const snipes = [makeSnipe(), makeSnipe({ id: "snipe-2" })];
    mockDb.query.snipes.findMany.mockResolvedValueOnce(snipes);

    const result = await listSnipes(TEST_USER_ID);

    expect(result).toHaveLength(2);
  });

  it("returns empty array when no snipes", async () => {
    mockDb.query.snipes.findMany.mockResolvedValueOnce([]);

    const result = await listSnipes(TEST_USER_ID);

    expect(result).toEqual([]);
  });
});

describe("getSnipe", () => {
  it("finds by snipeId and userId", async () => {
    mockDb.query.snipes.findFirst.mockResolvedValueOnce(makeSnipe());

    const result = await getSnipe(TEST_SNIPE_ID, TEST_USER_ID);

    expect(result).toBeDefined();
    expect(result!.id).toBe(TEST_SNIPE_ID);
  });

  it("returns undefined when not found", async () => {
    mockDb.query.snipes.findFirst.mockResolvedValueOnce(undefined);

    const result = await getSnipe("nonexistent", TEST_USER_ID);

    expect(result).toBeUndefined();
  });
});

describe("cancelSnipe", () => {
  it("cancels a scheduled snipe", async () => {
    mockDb.query.snipes.findFirst.mockResolvedValueOnce(makeSnipe({ status: "scheduled" }));
    mockDb._returning.mockResolvedValueOnce([makeSnipe({ status: "cancelled" })]);

    const result = await cancelSnipe(TEST_SNIPE_ID, TEST_USER_ID);

    expect(result.status).toBe("cancelled");
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("cancels a pre_staging snipe", async () => {
    mockDb.query.snipes.findFirst.mockResolvedValueOnce(makeSnipe({ status: "pre_staging" }));
    mockDb._returning.mockResolvedValueOnce([makeSnipe({ status: "cancelled" })]);

    const result = await cancelSnipe(TEST_SNIPE_ID, TEST_USER_ID);

    expect(result.status).toBe("cancelled");
  });

  it("removes BullMQ jobs when they exist", async () => {
    mockDb.query.snipes.findFirst.mockResolvedValueOnce(makeSnipe({ status: "scheduled" }));
    const mockJobRemove = vi.fn().mockResolvedValue(undefined);
    mockQueueGetJob.mockResolvedValue({ remove: mockJobRemove });
    mockDb._returning.mockResolvedValueOnce([makeSnipe({ status: "cancelled" })]);

    await cancelSnipe(TEST_SNIPE_ID, TEST_USER_ID);

    expect(mockQueueGetJob).toHaveBeenCalledWith(`snipe-prestage-${TEST_SNIPE_ID}`);
    expect(mockQueueGetJob).toHaveBeenCalledWith(`snipe-execute-${TEST_SNIPE_ID}`);
    expect(mockJobRemove).toHaveBeenCalledTimes(2);
  });

  it("throws when snipe not found", async () => {
    mockDb.query.snipes.findFirst.mockResolvedValueOnce(undefined);

    await expect(cancelSnipe("bad-id", TEST_USER_ID)).rejects.toThrow("Snipe not found");
  });

  it("throws when snipe is already executing", async () => {
    mockDb.query.snipes.findFirst.mockResolvedValueOnce(makeSnipe({ status: "executing" }));

    await expect(cancelSnipe(TEST_SNIPE_ID, TEST_USER_ID)).rejects.toThrow(
      "Cannot cancel snipe with status: executing",
    );
  });

  it("throws when snipe already succeeded", async () => {
    mockDb.query.snipes.findFirst.mockResolvedValueOnce(makeSnipe({ status: "succeeded" }));

    await expect(cancelSnipe(TEST_SNIPE_ID, TEST_USER_ID)).rejects.toThrow(
      "Cannot cancel snipe with status: succeeded",
    );
  });

  it("throws when snipe already failed", async () => {
    mockDb.query.snipes.findFirst.mockResolvedValueOnce(makeSnipe({ status: "failed" }));

    await expect(cancelSnipe(TEST_SNIPE_ID, TEST_USER_ID)).rejects.toThrow(
      "Cannot cancel snipe with status: failed",
    );
  });

  it("throws when snipe already cancelled", async () => {
    mockDb.query.snipes.findFirst.mockResolvedValueOnce(makeSnipe({ status: "cancelled" }));

    await expect(cancelSnipe(TEST_SNIPE_ID, TEST_USER_ID)).rejects.toThrow(
      "Cannot cancel snipe with status: cancelled",
    );
  });
});

describe("updateSnipeStatus", () => {
  it("updates status to succeeded with result booking ID", async () => {
    mockDb._returning.mockResolvedValueOnce([
      makeSnipe({ status: "succeeded", resultBookingId: "booking-abc" }),
    ]);

    const result = await updateSnipeStatus(TEST_SNIPE_ID, "succeeded", {
      resultBookingId: "booking-abc",
      executedAt: new Date(),
    });

    expect(result.status).toBe("succeeded");
    expect(result.resultBookingId).toBe("booking-abc");
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("updates status to failed with failure reason", async () => {
    mockDb._returning.mockResolvedValueOnce([
      makeSnipe({ status: "failed", failureReason: "No sites available" }),
    ]);

    const result = await updateSnipeStatus(TEST_SNIPE_ID, "failed", {
      failureReason: "No sites available",
      executedAt: new Date(),
    });

    expect(result.status).toBe("failed");
    expect(result.failureReason).toBe("No sites available");
  });

  it("updates status without extra fields", async () => {
    mockDb._returning.mockResolvedValueOnce([
      makeSnipe({ status: "pre_staging" }),
    ]);

    const result = await updateSnipeStatus(TEST_SNIPE_ID, "pre_staging");

    expect(result.status).toBe("pre_staging");
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("updates status to executing", async () => {
    mockDb._returning.mockResolvedValueOnce([
      makeSnipe({ status: "executing" }),
    ]);

    const result = await updateSnipeStatus(TEST_SNIPE_ID, "executing");

    expect(result.status).toBe("executing");
  });

  it("updates status to cancelled", async () => {
    mockDb._returning.mockResolvedValueOnce([
      makeSnipe({ status: "cancelled" }),
    ]);

    const result = await updateSnipeStatus(TEST_SNIPE_ID, "cancelled");

    expect(result.status).toBe("cancelled");
  });
});
