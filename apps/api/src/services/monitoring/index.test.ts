import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_ALERT_ID, makeAlert } from "../../test/fixtures.js";

const { mockDb, mockRedis, mockCheckAvailability, mockSendNotification } = vi.hoisted(() => {
  const returningFn = vi.fn().mockResolvedValue([{}]);
  const whereFn = vi.fn().mockReturnValue({ returning: returningFn });
  const setFn = vi.fn().mockReturnValue({ where: whereFn, returning: returningFn });
  const valuesFn = vi.fn().mockReturnValue({ returning: returningFn });
  const store = new Map<string, string>();
  return {
    mockDb: {
      query: {
        alerts: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
      },
      insert: vi.fn().mockReturnValue({ values: valuesFn }),
      update: vi.fn().mockReturnValue({ set: setFn }),
      _returning: returningFn,
      _where: whereFn,
      _set: setFn,
      _values: valuesFn,
    },
    mockRedis: {
      get: vi.fn(async (key: string) => store.get(key) ?? null),
      set: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
        return "OK";
      }),
      del: vi.fn(async (key: string) => {
        store.delete(key);
        return 1;
      }),
      _store: store,
    },
    mockCheckAvailability: vi.fn(),
    mockSendNotification: vi.fn(),
  };
});

vi.mock("../../db/index.js", () => ({ db: mockDb }));
vi.mock("ioredis", () => ({ default: vi.fn().mockImplementation(() => mockRedis) }));
vi.mock("../campsite/index.js", () => ({
  checkAvailability: (...args: unknown[]) => mockCheckAvailability(...args),
}));
vi.mock("../notification/index.js", () => ({
  sendNotification: (...args: unknown[]) => mockSendNotification(...args),
}));

import {
  scanAlert,
  getAlertsDueForScan,
  expireOldAlerts,
  clearAlertCache,
} from "./index.js";

beforeEach(() => {
  vi.clearAllMocks();
  mockRedis._store.clear();
});

describe("scanAlert", () => {
  it("returns empty when alert not found", async () => {
    mockDb.query.alerts.findFirst.mockResolvedValue(null);

    const result = await scanAlert(TEST_ALERT_ID);

    expect(result.newlyAvailable).toEqual([]);
    expect(result.totalAvailable).toBe(0);
  });

  it("returns empty when alert is not active", async () => {
    mockDb.query.alerts.findFirst.mockResolvedValue(makeAlert({ status: "paused" }));

    const result = await scanAlert(TEST_ALERT_ID);

    expect(result.newlyAvailable).toEqual([]);
  });

  it("fetches availability and detects newly available sites", async () => {
    mockDb.query.alerts.findFirst.mockResolvedValue(makeAlert());
    mockCheckAvailability.mockResolvedValue([
      { campsiteId: "site-1", campgroundId: "cg-1", available: true, availableDates: ["2025-07-01"] },
      { campsiteId: "site-2", campgroundId: "cg-1", available: false, availableDates: [] },
    ]);
    mockDb._returning.mockResolvedValue([{ id: TEST_ALERT_ID }]);

    const result = await scanAlert(TEST_ALERT_ID);

    expect(result.newlyAvailable).toContain("site-1");
    expect(result.totalAvailable).toBe(1);
  });

  it("compares with cache to find only new availability", async () => {
    mockDb.query.alerts.findFirst.mockResolvedValue(makeAlert());
    mockRedis._store.set(`availability:${TEST_ALERT_ID}`, JSON.stringify(["site-1"]));
    mockCheckAvailability.mockResolvedValue([
      { campsiteId: "site-1", campgroundId: "cg-1", available: true, availableDates: [] },
      { campsiteId: "site-2", campgroundId: "cg-1", available: true, availableDates: [] },
    ]);
    mockDb._returning.mockResolvedValue([{ id: TEST_ALERT_ID }]);

    const result = await scanAlert(TEST_ALERT_ID);

    expect(result.newlyAvailable).toEqual(["site-2"]);
  });

  it("updates Redis cache with TTL", async () => {
    mockDb.query.alerts.findFirst.mockResolvedValue(makeAlert());
    mockCheckAvailability.mockResolvedValue([
      { campsiteId: "site-1", campgroundId: "cg-1", available: true, availableDates: [] },
    ]);
    mockDb._returning.mockResolvedValue([{ id: TEST_ALERT_ID }]);

    await scanAlert(TEST_ALERT_ID);

    expect(mockRedis.set).toHaveBeenCalledWith(
      `availability:${TEST_ALERT_ID}`,
      JSON.stringify(["site-1"]),
      "EX",
      300
    );
  });

  it("updates lastScannedAt in database", async () => {
    mockDb.query.alerts.findFirst.mockResolvedValue(makeAlert());
    mockCheckAvailability.mockResolvedValue([]);
    mockDb._returning.mockResolvedValue([{ id: TEST_ALERT_ID }]);

    await scanAlert(TEST_ALERT_ID);

    expect(mockDb.update).toHaveBeenCalled();
  });

  it("sends notification when new sites are available", async () => {
    mockDb.query.alerts.findFirst.mockResolvedValue(makeAlert());
    mockCheckAvailability.mockResolvedValue([
      { campsiteId: "site-1", campgroundId: "cg-1", available: true, availableDates: [] },
    ]);
    mockDb._returning.mockResolvedValue([{ id: TEST_ALERT_ID }]);

    await scanAlert(TEST_ALERT_ID);

    expect(mockSendNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: "availability_alert" })
    );
  });

  it("does not send notification when no new sites", async () => {
    mockDb.query.alerts.findFirst.mockResolvedValue(makeAlert());
    mockRedis._store.set(`availability:${TEST_ALERT_ID}`, JSON.stringify(["site-1"]));
    mockCheckAvailability.mockResolvedValue([
      { campsiteId: "site-1", campgroundId: "cg-1", available: true, availableDates: [] },
    ]);

    await scanAlert(TEST_ALERT_ID);

    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it("sets triggered status when autoBook is true", async () => {
    mockDb.query.alerts.findFirst.mockResolvedValue(makeAlert({ autoBook: true }));
    mockCheckAvailability.mockResolvedValue([
      { campsiteId: "site-1", campgroundId: "cg-1", available: true, availableDates: [] },
    ]);
    mockDb._returning.mockResolvedValue([{ id: TEST_ALERT_ID }]);

    await scanAlert(TEST_ALERT_ID);

    expect(mockDb.update).toHaveBeenCalled();
  });
});

describe("getAlertsDueForScan", () => {
  it("returns unscanned alerts (lastScannedAt is null)", async () => {
    mockDb.query.alerts.findMany.mockResolvedValue([
      { id: "a-1", scanIntervalMs: 300000, lastScannedAt: null },
    ]);

    const result = await getAlertsDueForScan();

    expect(result).toHaveLength(1);
  });

  it("filters by scan interval", async () => {
    const recentScan = new Date(Date.now() - 60000);
    mockDb.query.alerts.findMany.mockResolvedValue([
      { id: "a-1", scanIntervalMs: 300000, lastScannedAt: recentScan },
    ]);

    const result = await getAlertsDueForScan();

    expect(result).toHaveLength(0);
  });
});

describe("expireOldAlerts", () => {
  it("expires past-endDate alerts", async () => {
    mockDb._returning.mockResolvedValue([{ id: "a-1" }]);
    mockSendNotification.mockResolvedValue(undefined);

    const count = await expireOldAlerts();

    expect(count).toBe(1);
    expect(mockDb.update).toHaveBeenCalled();
  });
});

describe("clearAlertCache", () => {
  it("deletes the Redis key", async () => {
    await clearAlertCache(TEST_ALERT_ID);

    expect(mockRedis.del).toHaveBeenCalledWith(`availability:${TEST_ALERT_ID}`);
  });
});
