export const TEST_USER_ID = "00000000-0000-0000-0000-000000000001";
export const TEST_BOOKING_ID = "00000000-0000-0000-0000-000000000002";
export const TEST_ALERT_ID = "00000000-0000-0000-0000-000000000003";
export const TEST_CAMPGROUND_ID = "00000000-0000-0000-0000-000000000004";
export const TEST_CAMPSITE_ID = "00000000-0000-0000-0000-000000000005";
export const TEST_CONVERSATION_ID = "00000000-0000-0000-0000-000000000006";
export const TEST_NOTIFICATION_ID = "00000000-0000-0000-0000-000000000007";
export const TEST_SNIPE_ID = "00000000-0000-0000-0000-000000000008";
export const TEST_CREDENTIAL_ID = "00000000-0000-0000-0000-000000000009";

export function makeCampsite(overrides: Record<string, unknown> = {}) {
  return {
    id: TEST_CAMPSITE_ID,
    campgroundId: TEST_CAMPGROUND_ID,
    campgroundName: "Test Campground",
    externalId: "ext-123",
    platform: "recreation_gov" as const,
    name: "Test Site A",
    description: "A nice test site",
    siteType: "tent" as const,
    maxOccupancy: 8,
    amenities: ["fire_ring", "picnic_table"],
    pricePerNight: 25,
    currency: "USD" as const,
    imageUrls: ["https://example.com/img.jpg"],
    latitude: 37.7749,
    longitude: -122.4194,
    region: "CA",
    country: "US" as const,
    available: true,
    availableDates: ["2025-07-01"],
    bookingUrl: "https://recreation.gov/booking/123",
    ...overrides,
  };
}

export function makeBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: TEST_BOOKING_ID,
    userId: TEST_USER_ID,
    alertId: null,
    campsiteId: TEST_CAMPSITE_ID,
    campsiteName: "Test Site A",
    campgroundName: "Test Campground",
    platform: "recreation_gov" as const,
    externalBookingId: null,
    startDate: "2025-07-01",
    endDate: "2025-07-03",
    totalCost: "50.00",
    currency: "USD",
    status: "pending" as const,
    bookingUrl: "https://recreation.gov/booking/123",
    createdAt: new Date("2025-06-01"),
    updatedAt: new Date("2025-06-01"),
    ...overrides,
  };
}

export function makeAlert(overrides: Record<string, unknown> = {}) {
  return {
    id: TEST_ALERT_ID,
    userId: TEST_USER_ID,
    campgroundId: TEST_CAMPGROUND_ID,
    platform: "recreation_gov" as const,
    startDate: "2025-07-01",
    endDate: "2025-07-05",
    siteTypes: ["tent"],
    autoBook: false,
    confirmFirst: true,
    status: "active" as const,
    scanIntervalMs: 300000,
    lastScannedAt: null,
    triggeredAt: null,
    createdAt: new Date("2025-06-01"),
    updatedAt: new Date("2025-06-01"),
    campground: {
      id: TEST_CAMPGROUND_ID,
      externalId: "ext-cg-123",
      name: "Test Campground",
    },
    ...overrides,
  };
}

export function makeSnipe(overrides: Record<string, unknown> = {}) {
  return {
    id: TEST_SNIPE_ID,
    userId: TEST_USER_ID,
    platformCredentialId: TEST_CREDENTIAL_ID,
    campgroundId: "cg-algonquin-123",
    campgroundName: "Algonquin Provincial Park",
    platform: "ontario_parks" as const,
    arrivalDate: "2027-08-15",
    departureDate: "2027-08-18",
    sitePreferences: ["site-101", "site-102", "site-103"],
    equipmentType: "tent" as const,
    occupants: 4,
    windowOpensAt: new Date("2027-03-15T12:00:00.000Z"),
    status: "scheduled" as const,
    resultBookingId: null,
    failureReason: null,
    executedAt: null,
    createdAt: new Date("2026-12-01"),
    updatedAt: new Date("2026-12-01"),
    ...overrides,
  };
}

export function makeCredential(overrides: Record<string, unknown> = {}) {
  return {
    id: TEST_CREDENTIAL_ID,
    userId: TEST_USER_ID,
    platform: "ontario_parks" as const,
    lastValidatedAt: null,
    createdAt: new Date("2026-12-01"),
    updatedAt: new Date("2026-12-01"),
    ...overrides,
  };
}
