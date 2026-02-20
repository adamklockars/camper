import type { NormalizedCampsite, Campground } from "@camper/shared-types";
import type {
  BasePlatformAdapter,
  SearchParams,
  AvailabilityResult,
} from "../base-adapter.js";

/**
 * Hipcamp platform adapter.
 *
 * Hipcamp does not offer a public API, so this adapter serves as a structured
 * placeholder. A future implementation would use authorized scraping or a
 * partnership API once available.
 */
export class HipcampAdapter implements BasePlatformAdapter {
  readonly platform = "hipcamp" as const;

  async searchCampsites(_params: SearchParams): Promise<NormalizedCampsite[]> {
    // Hipcamp does not have a public API.
    // This would be implemented via web scraping or a partnership API.
    console.warn("HipcampAdapter.searchCampsites: not yet implemented");
    return [];
  }

  async checkAvailability(
    _campgroundId: string,
    _startDate: string,
    _endDate: string
  ): Promise<AvailabilityResult[]> {
    console.warn("HipcampAdapter.checkAvailability: not yet implemented");
    return [];
  }

  async getCampsiteDetails(
    _campsiteId: string
  ): Promise<NormalizedCampsite | null> {
    console.warn("HipcampAdapter.getCampsiteDetails: not yet implemented");
    return null;
  }

  async getCampgroundDetails(
    _campgroundId: string
  ): Promise<Campground | null> {
    console.warn("HipcampAdapter.getCampgroundDetails: not yet implemented");
    return null;
  }
}
