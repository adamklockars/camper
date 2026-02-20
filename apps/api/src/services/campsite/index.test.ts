import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeCampsite } from "../../test/fixtures.js";

const {
  mockSearchCampsites,
  mockCheckAvailability,
  mockGetCampsiteDetails,
  mockGetCampgroundDetails,
} = vi.hoisted(() => ({
  mockSearchCampsites: vi.fn(),
  mockCheckAvailability: vi.fn(),
  mockGetCampsiteDetails: vi.fn(),
  mockGetCampgroundDetails: vi.fn(),
}));

vi.mock("../../integrations/recreation-gov/index.js", () => ({
  RecreationGovAdapter: vi.fn().mockImplementation(() => ({
    platform: "recreation_gov",
    searchCampsites: mockSearchCampsites,
    checkAvailability: mockCheckAvailability,
    getCampsiteDetails: mockGetCampsiteDetails,
    getCampgroundDetails: mockGetCampgroundDetails,
  })),
}));

vi.mock("../../integrations/hipcamp/index.js", () => ({
  HipcampAdapter: vi.fn().mockImplementation(() => ({
    platform: "hipcamp",
    searchCampsites: vi.fn().mockResolvedValue([]),
    checkAvailability: vi.fn().mockResolvedValue([]),
    getCampsiteDetails: vi.fn().mockResolvedValue(null),
    getCampgroundDetails: vi.fn().mockResolvedValue(null),
  })),
}));

vi.mock("../../integrations/parks-canada/index.js", () => ({
  ParksCanadaAdapter: vi.fn().mockImplementation(() => ({
    platform: "parks_canada",
    searchCampsites: vi.fn().mockResolvedValue([]),
    checkAvailability: vi.fn().mockResolvedValue([]),
    getCampsiteDetails: vi.fn().mockResolvedValue(null),
    getCampgroundDetails: vi.fn().mockResolvedValue(null),
  })),
}));

import { searchCampsites, getCampsite, getCampground } from "./index.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("searchCampsites", () => {
  it("queries adapters and returns results", async () => {
    mockSearchCampsites.mockResolvedValue([makeCampsite()]);

    const result = await searchCampsites({ query: "Yosemite" });

    expect(result.results.length).toBeGreaterThanOrEqual(1);
    expect(mockSearchCampsites).toHaveBeenCalled();
  });

  it("filters by siteType", async () => {
    mockSearchCampsites.mockResolvedValue([
      makeCampsite({ siteType: "tent" }),
      makeCampsite({ siteType: "rv", externalId: "ext-2", id: "cs-2" }),
    ]);

    const result = await searchCampsites({
      query: "test",
      siteTypes: ["tent"],
    });

    expect(result.results.every((r) => r.siteType === "tent")).toBe(true);
  });

  it("filters by maxPricePerNight", async () => {
    mockSearchCampsites.mockResolvedValue([
      makeCampsite({ pricePerNight: 20 }),
      makeCampsite({ pricePerNight: 100, externalId: "ext-2", id: "cs-2" }),
    ]);

    const result = await searchCampsites({
      query: "test",
      maxPricePerNight: 50,
    });

    expect(result.results.every((r) => r.pricePerNight <= 50)).toBe(true);
  });

  it("filters by groupSize (maxOccupancy)", async () => {
    mockSearchCampsites.mockResolvedValue([
      makeCampsite({ maxOccupancy: 4 }),
      makeCampsite({ maxOccupancy: 10, externalId: "ext-2", id: "cs-2" }),
    ]);

    const result = await searchCampsites({ query: "test", groupSize: 6 });

    expect(result.results.every((r) => r.maxOccupancy >= 6)).toBe(true);
  });

  it("paginates results", async () => {
    const sites = Array.from({ length: 5 }, (_, i) =>
      makeCampsite({ id: `cs-${i}`, externalId: `ext-${i}` })
    );
    mockSearchCampsites.mockResolvedValue(sites);

    const result = await searchCampsites({
      query: "test",
      limit: 2,
      page: 2,
    });

    expect(result.results).toHaveLength(2);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);
  });

  it("handles adapter error gracefully", async () => {
    mockSearchCampsites.mockRejectedValue(new Error("API down"));

    const result = await searchCampsites({ query: "test" });

    expect(result.results).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("filters by specific platform", async () => {
    mockSearchCampsites.mockResolvedValue([makeCampsite()]);

    const result = await searchCampsites({
      query: "test",
      platforms: ["recreation_gov"],
    });

    expect(mockSearchCampsites).toHaveBeenCalled();
    expect(result.results.length).toBeGreaterThanOrEqual(1);
  });
});

describe("getCampsite", () => {
  it("delegates to correct adapter", async () => {
    mockGetCampsiteDetails.mockResolvedValue(makeCampsite());

    const result = await getCampsite("recreation_gov", "cs-1");

    expect(result).toBeDefined();
    expect(mockGetCampsiteDetails).toHaveBeenCalledWith("cs-1");
  });

  it("returns null for unknown platform", async () => {
    const result = await getCampsite("nonexistent" as any, "cs-1");

    expect(result).toBeNull();
  });
});

describe("getCampground", () => {
  it("delegates to correct adapter", async () => {
    mockGetCampgroundDetails.mockResolvedValue({
      id: "cg-1",
      name: "Test CG",
    });

    const result = await getCampground("recreation_gov", "cg-1");

    expect(result).toBeDefined();
    expect(mockGetCampgroundDetails).toHaveBeenCalledWith("cg-1");
  });
});
