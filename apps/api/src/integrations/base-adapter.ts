import type { NormalizedCampsite, Campground, Platform } from "@camper/shared-types";

export interface SearchParams {
  query?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  radiusMiles?: number;
  startDate?: string;
  endDate?: string;
  siteTypes?: string[];
  groupSize?: number;
  amenities?: string[];
  maxPricePerNight?: number;
  page?: number;
  limit?: number;
}

export interface AvailabilityResult {
  campsiteId: string;
  campgroundId: string;
  available: boolean;
  availableDates: string[];
}

export interface BasePlatformAdapter {
  readonly platform: Platform;

  searchCampsites(params: SearchParams): Promise<NormalizedCampsite[]>;

  checkAvailability(
    campgroundId: string,
    startDate: string,
    endDate: string
  ): Promise<AvailabilityResult[]>;

  getCampsiteDetails(campsiteId: string): Promise<NormalizedCampsite | null>;

  getCampgroundDetails(campgroundId: string): Promise<Campground | null>;
}
