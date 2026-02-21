import { env } from "../../env.js";

const BASE_URL = env.CAMPLY_SIDECAR_URL;

interface SidecarSearchRequest {
  provider: string;
  query?: string;
  state?: string;
  campground_id?: string;
  domain?: string;
}

interface SidecarAvailabilityRequest {
  provider: string;
  campground_id: string;
  start_date: string;
  end_date: string;
  domain?: string;
}

interface SidecarBookRequest {
  platform: string;
  username: string;
  password: string;
  campground_id: string;
  site_preferences: string[];
  arrival_date: string;
  departure_date: string;
  equipment_type: string;
  occupants: number;
  domain?: string;
}

interface SidecarLoginRequest {
  platform: string;
  username: string;
  password: string;
  domain?: string;
}

export interface SidecarCampground {
  id: string;
  name: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface SidecarSiteAvailability {
  site_id: string;
  site_name: string;
  available: boolean;
  available_dates: string[];
}

export interface SidecarBookResult {
  success: boolean;
  booking_id: string | null;
  site_id: string | null;
  confirmation_number: string | null;
  error: string | null;
}

export interface SidecarLoginResult {
  success: boolean;
  session_token: string | null;
  error: string | null;
}

async function sidecarFetch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    throw new Error(`Sidecar request failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<T>;
}

export async function searchCampgrounds(
  params: SidecarSearchRequest,
): Promise<{ results: SidecarCampground[]; total: number }> {
  return sidecarFetch("/search", params);
}

export async function checkAvailability(
  params: SidecarAvailabilityRequest,
): Promise<{ results: SidecarSiteAvailability[]; total: number }> {
  return sidecarFetch("/availability", params);
}

export async function executeBooking(
  params: SidecarBookRequest,
): Promise<SidecarBookResult> {
  return sidecarFetch("/book", params);
}

export async function validateLogin(
  params: SidecarLoginRequest,
): Promise<SidecarLoginResult> {
  return sidecarFetch("/book/login", params);
}

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/health`, { method: "GET" });
    return response.ok;
  } catch {
    return false;
  }
}

/** Map platform names to GoingToCamp domains */
export const PLATFORM_DOMAINS: Record<string, string> = {
  ontario_parks: "reservations.ontarioparks.ca",
  parks_canada: "reservation.pc.gc.ca",
};

/** Map our platform names to sidecar provider names */
export function platformToProvider(platform: string): string {
  switch (platform) {
    case "ontario_parks":
    case "parks_canada":
      return "going_to_camp";
    case "recreation_gov":
      return "recreation_gov";
    default:
      return platform;
  }
}
