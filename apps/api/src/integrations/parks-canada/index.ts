import type { NormalizedCampsite, Campground } from "@camper/shared-types";
import type {
  BasePlatformAdapter,
  SearchParams,
  AvailabilityResult,
} from "../base-adapter.js";

/**
 * Parks Canada reservation adapter.
 *
 * Parks Canada uses the reservation.pc.gc.ca system. This adapter is a
 * structured placeholder for a future implementation that will integrate
 * with their booking system.
 */
export class ParksCanadaAdapter implements BasePlatformAdapter {
  readonly platform = "parks_canada" as const;

  async searchCampsites(_params: SearchParams): Promise<NormalizedCampsite[]> {
    // Parks Canada reservation system integration pending.
    // Would call reservation.pc.gc.ca APIs or scrape availability pages.
    console.warn("ParksCanadaAdapter.searchCampsites: not yet implemented");
    return [];
  }

  async checkAvailability(
    _campgroundId: string,
    _startDate: string,
    _endDate: string
  ): Promise<AvailabilityResult[]> {
    console.warn(
      "ParksCanadaAdapter.checkAvailability: not yet implemented"
    );
    return [];
  }

  async getCampsiteDetails(
    _campsiteId: string
  ): Promise<NormalizedCampsite | null> {
    console.warn(
      "ParksCanadaAdapter.getCampsiteDetails: not yet implemented"
    );
    return null;
  }

  async getCampgroundDetails(
    _campgroundId: string
  ): Promise<Campground | null> {
    console.warn(
      "ParksCanadaAdapter.getCampgroundDetails: not yet implemented"
    );
    return null;
  }
}
