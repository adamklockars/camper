import type {
  BasePlatformAdapter,
  SearchParams,
  AvailabilityResult,
} from "../base-adapter.js";
import type { NormalizedCampsite, Campground, Platform } from "@camper/shared-types";
import {
  searchCampgrounds,
  checkAvailability,
  platformToProvider,
  PLATFORM_DOMAINS,
} from "./client.js";

/**
 * Platform adapter that delegates to the camply sidecar service.
 * Works for Ontario Parks, Parks Canada, and Recreation.gov.
 */
export class CamplyAdapter implements BasePlatformAdapter {
  readonly platform: Platform;

  constructor(platform: Platform) {
    this.platform = platform;
  }

  async searchCampsites(params: SearchParams): Promise<NormalizedCampsite[]> {
    const provider = platformToProvider(this.platform);
    const domain = PLATFORM_DOMAINS[this.platform];

    const result = await searchCampgrounds({
      provider,
      query: params.query ?? params.location,
      domain,
    });

    return result.results.map((cg) => ({
      id: cg.id,
      campgroundId: cg.id,
      campgroundName: cg.name,
      externalId: cg.id,
      platform: this.platform,
      name: cg.name,
      description: cg.description,
      siteType: "tent" as const,
      maxOccupancy: params.groupSize ?? 6,
      amenities: [],
      pricePerNight: 0,
      currency: "CAD" as const,
      imageUrls: [],
      latitude: cg.latitude ?? 0,
      longitude: cg.longitude ?? 0,
      region: this.platform === "ontario_parks" ? "Ontario" : "Canada",
      country: "CA" as const,
      available: true,
      availableDates: [],
      bookingUrl: domain ? `https://${domain}` : null,
    }));
  }

  async checkAvailability(
    campgroundId: string,
    startDate: string,
    endDate: string,
  ): Promise<AvailabilityResult[]> {
    const provider = platformToProvider(this.platform);
    const domain = PLATFORM_DOMAINS[this.platform];

    const result = await checkAvailability({
      provider,
      campground_id: campgroundId,
      start_date: startDate,
      end_date: endDate,
      domain,
    });

    return result.results.map((site) => ({
      campsiteId: site.site_id,
      campgroundId,
      available: site.available,
      availableDates: site.available_dates,
    }));
  }

  async getCampsiteDetails(_campsiteId: string): Promise<NormalizedCampsite | null> {
    // Not directly supported by sidecar — would require an additional endpoint
    return null;
  }

  async getCampgroundDetails(_campgroundId: string): Promise<Campground | null> {
    // Not directly supported by sidecar — would require an additional endpoint
    return null;
  }
}
