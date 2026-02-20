import { describe, it, expect } from "vitest";
import {
  platformSchema,
  siteTypeSchema,
  campgroundSchema,
  normalizedCampsiteSchema,
  searchCampsitesInputSchema,
  searchCampsitesOutputSchema,
} from "./campsite";

describe("platformSchema", () => {
  it("accepts all valid platforms", () => {
    const platforms = [
      "recreation_gov",
      "parks_canada",
      "reserve_america",
      "hipcamp",
      "glamping_hub",
      "tentrr",
    ];
    for (const p of platforms) {
      expect(platformSchema.parse(p)).toBe(p);
    }
  });

  it("rejects invalid platform", () => {
    expect(() => platformSchema.parse("airbnb")).toThrow();
  });
});

describe("siteTypeSchema", () => {
  it("accepts all valid site types", () => {
    const types = ["tent", "rv", "cabin", "yurt", "glamping", "backcountry", "group"];
    for (const t of types) {
      expect(siteTypeSchema.parse(t)).toBe(t);
    }
  });

  it("rejects invalid site type", () => {
    expect(() => siteTypeSchema.parse("treehouse")).toThrow();
  });
});

describe("campgroundSchema", () => {
  const validCampground = {
    id: "cg-1",
    externalId: "ext-1",
    platform: "recreation_gov",
    name: "Yosemite Valley",
    description: "Beautiful valley campground",
    region: "CA",
    state: "California",
    country: "US",
    latitude: 37.7456,
    longitude: -119.5936,
    amenities: ["restrooms", "water"],
    totalSites: 200,
    imageUrl: "https://example.com/img.jpg",
    reservationUrl: "https://recreation.gov/camping/1",
  };

  it("accepts a valid campground", () => {
    expect(campgroundSchema.parse(validCampground)).toEqual(validCampground);
  });

  it("rejects missing required fields", () => {
    const { name, ...rest } = validCampground;
    expect(() => campgroundSchema.parse(rest)).toThrow();
  });

  it("allows nullable description, state, imageUrl, reservationUrl", () => {
    const result = campgroundSchema.parse({
      ...validCampground,
      description: null,
      state: null,
      imageUrl: null,
      reservationUrl: null,
    });
    expect(result.description).toBeNull();
    expect(result.state).toBeNull();
    expect(result.imageUrl).toBeNull();
    expect(result.reservationUrl).toBeNull();
  });
});

describe("normalizedCampsiteSchema", () => {
  const validCampsite = {
    id: "cs-1",
    campgroundId: "cg-1",
    campgroundName: "Test CG",
    externalId: "ext-1",
    platform: "recreation_gov",
    name: "Site A",
    description: null,
    siteType: "tent",
    maxOccupancy: 6,
    amenities: [],
    pricePerNight: 25,
    currency: "USD",
    imageUrls: ["https://example.com/a.jpg"],
    latitude: 37.0,
    longitude: -119.0,
    region: "CA",
    country: "US",
    available: true,
    availableDates: [],
    bookingUrl: null,
  };

  it("accepts a valid campsite", () => {
    expect(normalizedCampsiteSchema.parse(validCampsite)).toEqual(validCampsite);
  });

  it("rejects non-URL imageUrls", () => {
    expect(() =>
      normalizedCampsiteSchema.parse({
        ...validCampsite,
        imageUrls: ["not-a-url"],
      })
    ).toThrow();
  });
});

describe("searchCampsitesInputSchema", () => {
  it("applies defaults for page and limit", () => {
    const result = searchCampsitesInputSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("rejects limit > 50", () => {
    expect(() => searchCampsitesInputSchema.parse({ limit: 51 })).toThrow();
  });

  it("rejects page < 1", () => {
    expect(() => searchCampsitesInputSchema.parse({ page: 0 })).toThrow();
  });
});

describe("searchCampsitesOutputSchema", () => {
  it("validates output shape", () => {
    const output = {
      results: [],
      total: 0,
      page: 1,
      totalPages: 1,
    };
    expect(searchCampsitesOutputSchema.parse(output)).toEqual(output);
  });
});
