import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockFetchResponse } from "../../test/mocks/fetch.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { RecreationGovAdapter } from "./index.js";

const adapter = new RecreationGovAdapter("test-api-key");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RecreationGovAdapter.searchCampsites", () => {
  const mockRIDBResponse = {
    RECDATA: [
      {
        FacilityID: "232447",
        FacilityName: "Yosemite Valley",
        FacilityDescription: "Beautiful campground",
        FacilityLatitude: 37.7456,
        FacilityLongitude: -119.5936,
        FacilityPhone: "555-0100",
        FacilityEmail: "info@test.com",
        FacilityReservationURL: "https://recreation.gov/camping/232447",
        FacilityMapURL: "",
        GEOJSON: null,
        FacilityAdaAccess: "",
        Enabled: true,
        LastUpdatedDate: "2025-01-01",
        StayLimit: "14",
        FacilityTypeDescription: "Campground",
        Reservable: true,
        ParentOrgID: "1",
        ParentRecAreaID: "1",
        ACTIVITY: [{ ActivityName: "CAMPING" }],
        MEDIA: [{ URL: "https://example.com/img.jpg", MediaType: "Image" }],
        ADDRESS: [
          { AddressStateCode: "CA", AddressCountryCode: "US", City: "Yosemite" },
        ],
      },
      {
        FacilityID: "999",
        FacilityName: "Closed Site",
        FacilityDescription: "",
        FacilityLatitude: 0,
        FacilityLongitude: 0,
        FacilityPhone: "",
        FacilityEmail: "",
        FacilityReservationURL: "",
        FacilityMapURL: "",
        GEOJSON: null,
        FacilityAdaAccess: "",
        Enabled: false,
        LastUpdatedDate: "2025-01-01",
        StayLimit: "",
        FacilityTypeDescription: "",
        Reservable: false,
        ParentOrgID: "",
        ParentRecAreaID: "",
        ACTIVITY: [],
        MEDIA: [],
        ADDRESS: [],
      },
    ],
    METADATA: { RESULTS: { CURRENT_COUNT: 2, TOTAL_COUNT: 2 } },
  };

  it("constructs correct URL with query params", async () => {
    mockFetch.mockResolvedValue(mockFetchResponse(mockRIDBResponse));

    await adapter.searchCampsites({ query: "Yosemite" });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("ridb.recreation.gov/api/v1/facilities");
    expect(url).toContain("query=Yosemite");
    expect(url).toContain("activity=CAMPING");
  });

  it("sends apikey header", async () => {
    mockFetch.mockResolvedValue(mockFetchResponse(mockRIDBResponse));

    await adapter.searchCampsites({ query: "test" });

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.apikey).toBe("test-api-key");
  });

  it("filters to only Reservable and Enabled facilities", async () => {
    mockFetch.mockResolvedValue(mockFetchResponse(mockRIDBResponse));

    const results = await adapter.searchCampsites({ query: "test" });

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Yosemite Valley");
  });

  it("maps fields correctly", async () => {
    mockFetch.mockResolvedValue(mockFetchResponse(mockRIDBResponse));

    const results = await adapter.searchCampsites({ query: "test" });

    expect(results[0].platform).toBe("recreation_gov");
    expect(results[0].externalId).toBe("232447");
    expect(results[0].region).toBe("CA");
    expect(results[0].country).toBe("US");
    expect(results[0].imageUrls).toEqual(["https://example.com/img.jpg"]);
  });

  it("throws on non-OK response", async () => {
    mockFetch.mockResolvedValue(mockFetchResponse({}, 500));

    await expect(adapter.searchCampsites({ query: "test" })).rejects.toThrow(
      "Recreation.gov API error"
    );
  });
});

describe("RecreationGovAdapter.checkAvailability", () => {
  it("constructs month-based URL", async () => {
    mockFetch.mockResolvedValue(
      mockFetchResponse({ campsites: {} })
    );

    await adapter.checkAvailability("232447", "2025-07-01", "2025-07-05");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("campground/232447/month");
    expect(url).toContain("start_date=2025-07-01T00:00:00.000Z");
  });

  it("finds available dates in range", async () => {
    mockFetch.mockResolvedValue(
      mockFetchResponse({
        campsites: {
          "site-1": {
            campsite_id: "site-1",
            site: "001",
            campsite_type: "STANDARD",
            max_num_people: 6,
            availabilities: {
              "2025-07-01T00:00:00Z": "Available",
              "2025-07-02T00:00:00Z": "Available",
              "2025-07-03T00:00:00Z": "Reserved",
            },
          },
        },
      })
    );

    const results = await adapter.checkAvailability(
      "232447",
      "2025-07-01",
      "2025-07-05"
    );

    expect(results[0].available).toBe(true);
    expect(results[0].availableDates).toContain("2025-07-01");
    expect(results[0].availableDates).toContain("2025-07-02");
  });

  it("returns not available when all Reserved", async () => {
    mockFetch.mockResolvedValue(
      mockFetchResponse({
        campsites: {
          "site-1": {
            campsite_id: "site-1",
            site: "001",
            campsite_type: "STANDARD",
            max_num_people: 6,
            availabilities: {
              "2025-07-01T00:00:00Z": "Reserved",
              "2025-07-02T00:00:00Z": "Reserved",
            },
          },
        },
      })
    );

    const results = await adapter.checkAvailability(
      "232447",
      "2025-07-01",
      "2025-07-05"
    );

    expect(results[0].available).toBe(false);
    expect(results[0].availableDates).toHaveLength(0);
  });
});

describe("RecreationGovAdapter.getCampsiteDetails", () => {
  it("returns null for 404", async () => {
    mockFetch.mockResolvedValue(mockFetchResponse({}, 404));

    const result = await adapter.getCampsiteDetails("nonexistent");

    expect(result).toBeNull();
  });
});

describe("RecreationGovAdapter.getCampgroundDetails", () => {
  it("maps facility to Campground correctly", async () => {
    mockFetch.mockResolvedValue(
      mockFetchResponse({
        FacilityID: "232447",
        FacilityName: "Yosemite Valley",
        FacilityDescription: "Beautiful",
        FacilityLatitude: 37.7456,
        FacilityLongitude: -119.5936,
        FacilityReservationURL: "https://recreation.gov/camping/232447",
        ACTIVITY: [{ ActivityName: "CAMPING" }],
        MEDIA: [{ URL: "https://example.com/cg.jpg", MediaType: "Image" }],
        ADDRESS: [{ AddressStateCode: "CA", AddressCountryCode: "US", City: "Yosemite" }],
        Enabled: true,
        Reservable: true,
      })
    );

    const result = await adapter.getCampgroundDetails("232447");

    expect(result).not.toBeNull();
    expect(result!.name).toBe("Yosemite Valley");
    expect(result!.platform).toBe("recreation_gov");
    expect(result!.country).toBe("US");
    expect(result!.imageUrl).toBe("https://example.com/cg.jpg");
  });
});
