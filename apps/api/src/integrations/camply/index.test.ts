import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSearchCampgrounds = vi.fn();
const mockCheckAvailability = vi.fn();

vi.mock("./client.js", () => ({
  searchCampgrounds: (...args: unknown[]) => mockSearchCampgrounds(...args),
  checkAvailability: (...args: unknown[]) => mockCheckAvailability(...args),
  platformToProvider: (platform: string) => {
    if (platform === "ontario_parks" || platform === "parks_canada") return "going_to_camp";
    return platform;
  },
  PLATFORM_DOMAINS: {
    ontario_parks: "reservations.ontarioparks.ca",
    parks_canada: "reservation.pc.gc.ca",
  } as Record<string, string>,
}));

import { CamplyAdapter } from "./index.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CamplyAdapter", () => {
  describe("constructor", () => {
    it("sets the platform", () => {
      const adapter = new CamplyAdapter("ontario_parks");
      expect(adapter.platform).toBe("ontario_parks");
    });
  });

  describe("searchCampsites", () => {
    it("delegates to sidecar with correct provider and domain", async () => {
      mockSearchCampgrounds.mockResolvedValueOnce({
        results: [],
        total: 0,
      });

      const adapter = new CamplyAdapter("ontario_parks");
      await adapter.searchCampsites({ query: "Algonquin" });

      expect(mockSearchCampgrounds).toHaveBeenCalledWith({
        provider: "going_to_camp",
        query: "Algonquin",
        domain: "reservations.ontarioparks.ca",
      });
    });

    it("uses location if query is not provided", async () => {
      mockSearchCampgrounds.mockResolvedValueOnce({ results: [], total: 0 });

      const adapter = new CamplyAdapter("ontario_parks");
      await adapter.searchCampsites({ location: "Ontario" });

      expect(mockSearchCampgrounds).toHaveBeenCalledWith(
        expect.objectContaining({ query: "Ontario" }),
      );
    });

    it("maps sidecar results to NormalizedCampsite[]", async () => {
      mockSearchCampgrounds.mockResolvedValueOnce({
        results: [
          {
            id: "cg-123",
            name: "Algonquin Provincial Park",
            description: "Beautiful park",
            latitude: 45.5,
            longitude: -78.3,
          },
        ],
        total: 1,
      });

      const adapter = new CamplyAdapter("ontario_parks");
      const results = await adapter.searchCampsites({ query: "Algonquin" });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("cg-123");
      expect(results[0].name).toBe("Algonquin Provincial Park");
      expect(results[0].platform).toBe("ontario_parks");
      expect(results[0].country).toBe("CA");
      expect(results[0].currency).toBe("CAD");
      expect(results[0].region).toBe("Ontario");
      expect(results[0].bookingUrl).toBe("https://reservations.ontarioparks.ca");
    });

    it("sets region to 'Canada' for non-Ontario Parks platforms", async () => {
      mockSearchCampgrounds.mockResolvedValueOnce({
        results: [{ id: "cg-1", name: "Park", description: null, latitude: 0, longitude: 0 }],
        total: 1,
      });

      const adapter = new CamplyAdapter("parks_canada");
      const results = await adapter.searchCampsites({ query: "test" });

      expect(results[0].region).toBe("Canada");
    });

    it("uses groupSize for maxOccupancy when provided", async () => {
      mockSearchCampgrounds.mockResolvedValueOnce({
        results: [{ id: "cg-1", name: "Park", description: null, latitude: 0, longitude: 0 }],
        total: 1,
      });

      const adapter = new CamplyAdapter("ontario_parks");
      const results = await adapter.searchCampsites({ groupSize: 10 });

      expect(results[0].maxOccupancy).toBe(10);
    });

    it("defaults maxOccupancy to 6 when groupSize not provided", async () => {
      mockSearchCampgrounds.mockResolvedValueOnce({
        results: [{ id: "cg-1", name: "Park", description: null, latitude: 0, longitude: 0 }],
        total: 1,
      });

      const adapter = new CamplyAdapter("ontario_parks");
      const results = await adapter.searchCampsites({});

      expect(results[0].maxOccupancy).toBe(6);
    });

    it("handles null latitude/longitude from sidecar", async () => {
      mockSearchCampgrounds.mockResolvedValueOnce({
        results: [
          { id: "cg-1", name: "Park", description: null, latitude: null, longitude: null },
        ],
        total: 1,
      });

      const adapter = new CamplyAdapter("ontario_parks");
      const results = await adapter.searchCampsites({});

      expect(results[0].latitude).toBe(0);
      expect(results[0].longitude).toBe(0);
    });
  });

  describe("checkAvailability", () => {
    it("delegates to sidecar and maps results", async () => {
      mockCheckAvailability.mockResolvedValueOnce({
        results: [
          { site_id: "s-1", site_name: "Site 1", available: true, available_dates: ["2027-08-15"] },
          { site_id: "s-2", site_name: "Site 2", available: false, available_dates: [] },
        ],
        total: 2,
      });

      const adapter = new CamplyAdapter("ontario_parks");
      const results = await adapter.checkAvailability("cg-123", "2027-08-15", "2027-08-18");

      expect(results).toHaveLength(2);
      expect(results[0].campsiteId).toBe("s-1");
      expect(results[0].campgroundId).toBe("cg-123");
      expect(results[0].available).toBe(true);
      expect(results[0].availableDates).toEqual(["2027-08-15"]);
      expect(results[1].available).toBe(false);
    });

    it("passes correct params to sidecar", async () => {
      mockCheckAvailability.mockResolvedValueOnce({ results: [], total: 0 });

      const adapter = new CamplyAdapter("ontario_parks");
      await adapter.checkAvailability("cg-456", "2027-07-01", "2027-07-05");

      expect(mockCheckAvailability).toHaveBeenCalledWith({
        provider: "going_to_camp",
        campground_id: "cg-456",
        start_date: "2027-07-01",
        end_date: "2027-07-05",
        domain: "reservations.ontarioparks.ca",
      });
    });
  });

  describe("getCampsiteDetails", () => {
    it("returns null (not supported by sidecar)", async () => {
      const adapter = new CamplyAdapter("ontario_parks");
      const result = await adapter.getCampsiteDetails("site-123");
      expect(result).toBeNull();
    });
  });

  describe("getCampgroundDetails", () => {
    it("returns null (not supported by sidecar)", async () => {
      const adapter = new CamplyAdapter("ontario_parks");
      const result = await adapter.getCampgroundDetails("cg-123");
      expect(result).toBeNull();
    });
  });
});
