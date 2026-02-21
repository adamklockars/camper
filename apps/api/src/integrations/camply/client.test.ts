import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockFetchResponse } from "../../test/mocks/fetch.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  searchCampgrounds,
  checkAvailability,
  executeBooking,
  validateLogin,
  healthCheck,
  platformToProvider,
  PLATFORM_DOMAINS,
} from "./client.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("searchCampgrounds", () => {
  it("sends POST to /search with correct body", async () => {
    const mockResponse = { results: [], total: 0 };
    mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

    await searchCampgrounds({
      provider: "going_to_camp",
      query: "Algonquin",
      domain: "reservations.ontarioparks.ca",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/search",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.provider).toBe("going_to_camp");
    expect(body.query).toBe("Algonquin");
    expect(body.domain).toBe("reservations.ontarioparks.ca");
  });

  it("returns parsed results", async () => {
    const mockResponse = {
      results: [
        { id: "cg-1", name: "Algonquin", description: null, latitude: 45.5, longitude: -78.3 },
      ],
      total: 1,
    };
    mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

    const result = await searchCampgrounds({ provider: "going_to_camp" });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].name).toBe("Algonquin");
    expect(result.total).toBe(1);
  });

  it("throws on non-OK response", async () => {
    mockFetch.mockResolvedValueOnce(mockFetchResponse("Server Error", 500));

    await expect(
      searchCampgrounds({ provider: "going_to_camp" }),
    ).rejects.toThrow("Sidecar request failed (500)");
  });
});

describe("checkAvailability", () => {
  it("sends POST to /availability", async () => {
    const mockResponse = { results: [], total: 0 };
    mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

    await checkAvailability({
      provider: "going_to_camp",
      campground_id: "cg-123",
      start_date: "2027-08-15",
      end_date: "2027-08-18",
      domain: "reservations.ontarioparks.ca",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/availability",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns availability results", async () => {
    const mockResponse = {
      results: [
        { site_id: "site-1", site_name: "Site A", available: true, available_dates: ["2027-08-15", "2027-08-16"] },
        { site_id: "site-2", site_name: "Site B", available: false, available_dates: [] },
      ],
      total: 2,
    };
    mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

    const result = await checkAvailability({
      provider: "going_to_camp",
      campground_id: "cg-123",
      start_date: "2027-08-15",
      end_date: "2027-08-18",
    });

    expect(result.results).toHaveLength(2);
    expect(result.results[0].available).toBe(true);
    expect(result.results[1].available).toBe(false);
  });
});

describe("executeBooking", () => {
  it("sends POST to /book with credentials and site preferences", async () => {
    const mockResponse = {
      success: true,
      booking_id: "booking-123",
      site_id: "site-101",
      confirmation_number: "CONF-ABC",
      error: null,
    };
    mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

    const result = await executeBooking({
      platform: "ontario_parks",
      username: "user@test.com",
      password: "pass123",
      campground_id: "cg-123",
      site_preferences: ["site-101", "site-102"],
      arrival_date: "2027-08-15",
      departure_date: "2027-08-18",
      equipment_type: "tent",
      occupants: 4,
      domain: "reservations.ontarioparks.ca",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/book",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.success).toBe(true);
    expect(result.booking_id).toBe("booking-123");
    expect(result.confirmation_number).toBe("CONF-ABC");
  });

  it("returns failure result when booking fails", async () => {
    const mockResponse = {
      success: false,
      booking_id: null,
      site_id: null,
      confirmation_number: null,
      error: "No preferred sites available",
    };
    mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

    const result = await executeBooking({
      platform: "ontario_parks",
      username: "user@test.com",
      password: "pass123",
      campground_id: "cg-123",
      site_preferences: ["site-999"],
      arrival_date: "2027-08-15",
      departure_date: "2027-08-18",
      equipment_type: "tent",
      occupants: 2,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("No preferred sites available");
  });

  it("throws on sidecar HTTP error", async () => {
    mockFetch.mockResolvedValueOnce(mockFetchResponse("Internal error", 502));

    await expect(
      executeBooking({
        platform: "ontario_parks",
        username: "user@test.com",
        password: "pass123",
        campground_id: "cg-123",
        site_preferences: ["site-101"],
        arrival_date: "2027-08-15",
        departure_date: "2027-08-18",
        equipment_type: "tent",
        occupants: 2,
      }),
    ).rejects.toThrow("Sidecar request failed (502)");
  });
});

describe("validateLogin", () => {
  it("sends POST to /book/login", async () => {
    const mockResponse = { success: true, session_token: "tok-abc", error: null };
    mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

    const result = await validateLogin({
      platform: "ontario_parks",
      username: "user@test.com",
      password: "pass123",
      domain: "reservations.ontarioparks.ca",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/book/login",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.success).toBe(true);
    expect(result.session_token).toBe("tok-abc");
  });

  it("returns failure on bad credentials", async () => {
    const mockResponse = {
      success: false,
      session_token: null,
      error: "Login failed (HTTP 401). Please check your credentials.",
    };
    mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

    const result = await validateLogin({
      platform: "ontario_parks",
      username: "bad@test.com",
      password: "wrong",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Login failed");
  });
});

describe("healthCheck", () => {
  it("returns true when sidecar is healthy", async () => {
    mockFetch.mockResolvedValueOnce(mockFetchResponse({ status: "ok" }));

    const result = await healthCheck();

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/health",
      { method: "GET" },
    );
  });

  it("returns false when sidecar is down", async () => {
    mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const result = await healthCheck();

    expect(result).toBe(false);
  });

  it("returns false on non-OK response", async () => {
    mockFetch.mockResolvedValueOnce(mockFetchResponse({}, 503));

    const result = await healthCheck();

    expect(result).toBe(false);
  });
});

describe("platformToProvider", () => {
  it("maps ontario_parks to going_to_camp", () => {
    expect(platformToProvider("ontario_parks")).toBe("going_to_camp");
  });

  it("maps parks_canada to going_to_camp", () => {
    expect(platformToProvider("parks_canada")).toBe("going_to_camp");
  });

  it("maps recreation_gov to recreation_gov", () => {
    expect(platformToProvider("recreation_gov")).toBe("recreation_gov");
  });

  it("returns input for unknown platforms", () => {
    expect(platformToProvider("hipcamp")).toBe("hipcamp");
  });
});

describe("PLATFORM_DOMAINS", () => {
  it("has ontario_parks domain", () => {
    expect(PLATFORM_DOMAINS.ontario_parks).toBe("reservations.ontarioparks.ca");
  });

  it("has parks_canada domain", () => {
    expect(PLATFORM_DOMAINS.parks_canada).toBe("reservation.pc.gc.ca");
  });
});
