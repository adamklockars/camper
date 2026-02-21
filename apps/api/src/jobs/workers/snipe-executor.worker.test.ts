import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  TEST_USER_ID,
  TEST_SNIPE_ID,
  TEST_CREDENTIAL_ID,
  makeSnipe,
} from "../../test/fixtures.js";

// ── Hoisted mocks ──────────────────────────────────────────────────────

const {
  mockDb,
  mockRedis,
  mockUpdateSnipeStatus,
  mockGetDecryptedCredentialById,
  mockSendNotification,
  mockExecuteBooking,
  mockValidateLogin,
  mockQueueAdd,
} = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    mockDb: {
      query: {
        snipes: { findFirst: vi.fn() },
      },
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
    mockUpdateSnipeStatus: vi.fn().mockResolvedValue({}),
    mockGetDecryptedCredentialById: vi.fn(),
    mockSendNotification: vi.fn().mockResolvedValue(undefined),
    mockExecuteBooking: vi.fn(),
    mockValidateLogin: vi.fn(),
    mockQueueAdd: vi.fn().mockResolvedValue({}),
  };
});

// ── vi.mock calls ──────────────────────────────────────────────────────

vi.mock("../../db/index.js", () => ({ db: mockDb }));
vi.mock("../../db/schema/index.js", () => ({
  snipes: { id: "id" },
}));
vi.mock("ioredis", () => ({
  default: vi.fn().mockImplementation(() => mockRedis),
}));
vi.mock("bullmq", () => ({
  Worker: vi.fn().mockImplementation((_name: string, processor: Function) => {
    // Store the processor so we can call it in tests
    (globalThis as any).__snipeProcessor = processor;
    return {
      name: "snipe-executor",
      on: vi.fn(),
      close: vi.fn(),
    };
  }),
  Queue: vi.fn(),
}));
vi.mock("../../services/snipe/index.js", () => ({
  updateSnipeStatus: (...args: unknown[]) => mockUpdateSnipeStatus(...args),
}));
vi.mock("../../services/credential/index.js", () => ({
  getDecryptedCredentialById: (...args: unknown[]) => mockGetDecryptedCredentialById(...args),
}));
vi.mock("../../services/notification/index.js", () => ({
  sendNotification: (...args: unknown[]) => mockSendNotification(...args),
}));
vi.mock("../../integrations/camply/client.js", () => ({
  executeBooking: (...args: unknown[]) => mockExecuteBooking(...args),
  validateLogin: (...args: unknown[]) => mockValidateLogin(...args),
  PLATFORM_DOMAINS: {
    ontario_parks: "reservations.ontarioparks.ca",
    parks_canada: "reservation.pc.gc.ca",
  } as Record<string, string>,
}));
vi.mock("../queues.js", () => ({
  snipeExecutorQueue: {
    add: (...args: unknown[]) => mockQueueAdd(...args),
  },
}));

// Import triggers the Worker constructor, which stores the processor
import "./snipe-executor.worker.js";

function getProcessor(): (job: { data: { snipeId: string; phase: string; sessionToken?: string } }) => Promise<any> {
  return (globalThis as any).__snipeProcessor;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRedis._store.clear();
});

// ── Tests ──────────────────────────────────────────────────────────────

describe("snipe-executor worker", () => {
  describe("general", () => {
    it("throws when snipe not found", async () => {
      mockDb.query.snipes.findFirst.mockResolvedValueOnce(null);

      const processor = getProcessor();
      await expect(
        processor({ data: { snipeId: "bad-id", phase: "pre_stage" } }),
      ).rejects.toThrow("Snipe bad-id not found");
    });

    it("skips cancelled snipes", async () => {
      mockDb.query.snipes.findFirst.mockResolvedValueOnce(
        makeSnipe({ status: "cancelled" }),
      );

      const processor = getProcessor();
      const result = await processor({
        data: { snipeId: TEST_SNIPE_ID, phase: "pre_stage" },
      });

      expect(result).toEqual({ status: "cancelled" });
      expect(mockUpdateSnipeStatus).not.toHaveBeenCalled();
    });
  });

  describe("pre_stage phase", () => {
    it("authenticates and schedules execute phase", async () => {
      mockDb.query.snipes.findFirst.mockResolvedValueOnce(makeSnipe());
      mockGetDecryptedCredentialById.mockResolvedValueOnce({
        userId: TEST_USER_ID,
        platform: "ontario_parks",
        credentials: { username: "user@test.com", password: "pass123" },
      });
      mockValidateLogin.mockResolvedValueOnce({
        success: true,
        session_token: "session-tok-abc",
        error: null,
      });

      const processor = getProcessor();
      const result = await processor({
        data: { snipeId: TEST_SNIPE_ID, phase: "pre_stage" },
      });

      expect(result.status).toBe("pre_staged");
      expect(mockUpdateSnipeStatus).toHaveBeenCalledWith(TEST_SNIPE_ID, "pre_staging");
      expect(mockValidateLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: "ontario_parks",
          username: "user@test.com",
          password: "pass123",
        }),
      );
      // Session should be stored in Redis
      expect(mockRedis.set).toHaveBeenCalledWith(
        `snipe:session:${TEST_SNIPE_ID}`,
        "session-tok-abc",
        "EX",
        600,
      );
      // Execute phase should be scheduled
      expect(mockQueueAdd).toHaveBeenCalledWith(
        "execute",
        expect.objectContaining({
          snipeId: TEST_SNIPE_ID,
          phase: "execute",
          sessionToken: "session-tok-abc",
        }),
        expect.objectContaining({
          jobId: `snipe-execute-${TEST_SNIPE_ID}`,
        }),
      );
    });

    it("fails when credentials not found", async () => {
      mockDb.query.snipes.findFirst.mockResolvedValueOnce(makeSnipe());
      mockGetDecryptedCredentialById.mockResolvedValueOnce(null);

      const processor = getProcessor();
      const result = await processor({
        data: { snipeId: TEST_SNIPE_ID, phase: "pre_stage" },
      });

      expect(result.status).toBe("failed");
      expect(result.reason).toBe("credentials_not_found");
      expect(mockUpdateSnipeStatus).toHaveBeenCalledWith(
        TEST_SNIPE_ID,
        "failed",
        expect.objectContaining({ failureReason: expect.stringContaining("credentials") }),
      );
      expect(mockSendNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: "system" }),
      );
    });

    it("fails when login fails", async () => {
      mockDb.query.snipes.findFirst.mockResolvedValueOnce(makeSnipe());
      mockGetDecryptedCredentialById.mockResolvedValueOnce({
        userId: TEST_USER_ID,
        platform: "ontario_parks",
        credentials: { username: "user@test.com", password: "wrongpass" },
      });
      mockValidateLogin.mockResolvedValueOnce({
        success: false,
        session_token: null,
        error: "Invalid credentials",
      });

      const processor = getProcessor();
      const result = await processor({
        data: { snipeId: TEST_SNIPE_ID, phase: "pre_stage" },
      });

      expect(result.status).toBe("failed");
      expect(result.reason).toBe("login_failed");
      expect(mockUpdateSnipeStatus).toHaveBeenCalledWith(
        TEST_SNIPE_ID,
        "failed",
        expect.objectContaining({
          failureReason: expect.stringContaining("Invalid credentials"),
        }),
      );
      expect(mockSendNotification).toHaveBeenCalled();
    });
  });

  describe("execute phase", () => {
    it("books successfully and sends confirmation notification", async () => {
      mockDb.query.snipes.findFirst.mockResolvedValueOnce(makeSnipe());
      mockGetDecryptedCredentialById.mockResolvedValueOnce({
        userId: TEST_USER_ID,
        platform: "ontario_parks",
        credentials: { username: "user@test.com", password: "pass123" },
      });
      mockExecuteBooking.mockResolvedValueOnce({
        success: true,
        booking_id: "booking-xyz",
        site_id: "site-101",
        confirmation_number: "CONF-123",
        error: null,
      });

      const processor = getProcessor();
      const result = await processor({
        data: { snipeId: TEST_SNIPE_ID, phase: "execute" },
      });

      expect(result.status).toBe("succeeded");
      expect(result.bookingId).toBe("booking-xyz");

      // Should update status to executing first, then succeeded
      expect(mockUpdateSnipeStatus).toHaveBeenCalledWith(TEST_SNIPE_ID, "executing");
      expect(mockUpdateSnipeStatus).toHaveBeenCalledWith(
        TEST_SNIPE_ID,
        "succeeded",
        expect.objectContaining({
          resultBookingId: "booking-xyz",
          executedAt: expect.any(Date),
        }),
      );

      // Should send booking confirmation notification
      expect(mockSendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: TEST_USER_ID,
          type: "booking_confirmation",
          title: "Campsite booked!",
        }),
      );

      // Should clean up session from Redis
      expect(mockRedis.del).toHaveBeenCalledWith(`snipe:session:${TEST_SNIPE_ID}`);
    });

    it("passes all parameters to executeBooking", async () => {
      const snipe = makeSnipe({
        platform: "ontario_parks",
        campgroundId: "cg-algonquin",
        sitePreferences: ["site-A", "site-B", "site-C"],
        arrivalDate: "2027-08-15",
        departureDate: "2027-08-18",
        equipmentType: "rv",
        occupants: 6,
      });
      mockDb.query.snipes.findFirst.mockResolvedValueOnce(snipe);
      mockGetDecryptedCredentialById.mockResolvedValueOnce({
        userId: TEST_USER_ID,
        platform: "ontario_parks",
        credentials: { username: "test@user.com", password: "p@ss" },
      });
      mockExecuteBooking.mockResolvedValueOnce({
        success: true,
        booking_id: "b-1",
        site_id: "site-A",
        confirmation_number: null,
        error: null,
      });

      const processor = getProcessor();
      await processor({ data: { snipeId: TEST_SNIPE_ID, phase: "execute" } });

      expect(mockExecuteBooking).toHaveBeenCalledWith({
        platform: "ontario_parks",
        username: "test@user.com",
        password: "p@ss",
        campground_id: "cg-algonquin",
        site_preferences: ["site-A", "site-B", "site-C"],
        arrival_date: "2027-08-15",
        departure_date: "2027-08-18",
        equipment_type: "rv",
        occupants: 6,
        domain: "reservations.ontarioparks.ca",
      });
    });

    it("handles booking failure", async () => {
      mockDb.query.snipes.findFirst.mockResolvedValueOnce(makeSnipe());
      mockGetDecryptedCredentialById.mockResolvedValueOnce({
        userId: TEST_USER_ID,
        platform: "ontario_parks",
        credentials: { username: "user@test.com", password: "pass123" },
      });
      mockExecuteBooking.mockResolvedValueOnce({
        success: false,
        booking_id: null,
        site_id: null,
        confirmation_number: null,
        error: "No preferred sites were available",
      });

      const processor = getProcessor();
      const result = await processor({
        data: { snipeId: TEST_SNIPE_ID, phase: "execute" },
      });

      expect(result.status).toBe("failed");
      expect(result.error).toBe("No preferred sites were available");

      expect(mockUpdateSnipeStatus).toHaveBeenCalledWith(
        TEST_SNIPE_ID,
        "failed",
        expect.objectContaining({
          failureReason: "No preferred sites were available",
          executedAt: expect.any(Date),
        }),
      );

      // Should send failure notification
      expect(mockSendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "system",
          title: "Snipe booking failed",
        }),
      );

      // Should still clean up Redis
      expect(mockRedis.del).toHaveBeenCalled();
    });

    it("fails when credentials not found at execution time", async () => {
      mockDb.query.snipes.findFirst.mockResolvedValueOnce(makeSnipe());
      mockGetDecryptedCredentialById.mockResolvedValueOnce(null);

      const processor = getProcessor();
      const result = await processor({
        data: { snipeId: TEST_SNIPE_ID, phase: "execute" },
      });

      expect(result.status).toBe("failed");
      expect(result.reason).toBe("credentials_not_found");
      expect(mockUpdateSnipeStatus).toHaveBeenCalledWith(
        TEST_SNIPE_ID,
        "failed",
        expect.objectContaining({
          failureReason: "Credentials not found at execution time",
        }),
      );
    });

    it("uses confirmation_number as fallback for resultBookingId", async () => {
      mockDb.query.snipes.findFirst.mockResolvedValueOnce(makeSnipe());
      mockGetDecryptedCredentialById.mockResolvedValueOnce({
        userId: TEST_USER_ID,
        platform: "ontario_parks",
        credentials: { username: "user@test.com", password: "pass123" },
      });
      mockExecuteBooking.mockResolvedValueOnce({
        success: true,
        booking_id: null,
        site_id: "site-101",
        confirmation_number: "CONF-456",
        error: null,
      });

      const processor = getProcessor();
      await processor({
        data: { snipeId: TEST_SNIPE_ID, phase: "execute" },
      });

      expect(mockUpdateSnipeStatus).toHaveBeenCalledWith(
        TEST_SNIPE_ID,
        "succeeded",
        expect.objectContaining({
          resultBookingId: "CONF-456",
        }),
      );
    });

    it("includes snipe details in success notification body", async () => {
      const snipe = makeSnipe({
        campgroundName: "Killarney Provincial Park",
        arrivalDate: "2027-09-01",
        departureDate: "2027-09-04",
      });
      mockDb.query.snipes.findFirst.mockResolvedValueOnce(snipe);
      mockGetDecryptedCredentialById.mockResolvedValueOnce({
        userId: TEST_USER_ID,
        platform: "ontario_parks",
        credentials: { username: "u", password: "p" },
      });
      mockExecuteBooking.mockResolvedValueOnce({
        success: true,
        booking_id: "b-1",
        site_id: "site-50",
        confirmation_number: null,
        error: null,
      });

      const processor = getProcessor();
      await processor({
        data: { snipeId: TEST_SNIPE_ID, phase: "execute" },
      });

      expect(mockSendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining("Killarney Provincial Park"),
        }),
      );
      expect(mockSendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining("site-50"),
        }),
      );
    });
  });
});
