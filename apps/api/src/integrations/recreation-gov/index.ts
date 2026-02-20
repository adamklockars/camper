import type { NormalizedCampsite, Campground } from "@camper/shared-types";
import type {
  BasePlatformAdapter,
  SearchParams,
  AvailabilityResult,
} from "../base-adapter.js";

const RIDB_BASE_URL = "https://ridb.recreation.gov/api/v1";
const RECREATION_GOV_API_URL = "https://www.recreation.gov/api/camps";

interface RIDBFacility {
  FacilityID: string;
  FacilityName: string;
  FacilityDescription: string;
  FacilityLatitude: number;
  FacilityLongitude: number;
  FacilityPhone: string;
  FacilityEmail: string;
  FacilityReservationURL: string;
  FacilityMapURL: string;
  GEOJSON: { COORDINATES: [number, number] } | null;
  FacilityAdaAccess: string;
  Enabled: boolean;
  LastUpdatedDate: string;
  StayLimit: string;
  FacilityTypeDescription: string;
  Reservable: boolean;
  ParentOrgID: string;
  ParentRecAreaID: string;
  ACTIVITY: Array<{ ActivityName: string }>;
  MEDIA: Array<{ URL: string; MediaType: string }>;
  ADDRESS: Array<{
    AddressStateCode: string;
    AddressCountryCode: string;
    City: string;
  }>;
}

interface RIDBResponse {
  RECDATA: RIDBFacility[];
  METADATA: {
    RESULTS: { CURRENT_COUNT: number; TOTAL_COUNT: number };
  };
}

interface AvailabilityCampsite {
  campsite_id: string;
  site: string;
  campsite_type: string;
  max_num_people: number;
  availabilities: Record<string, string>;
}

interface AvailabilityResponse {
  campsites: Record<string, AvailabilityCampsite>;
}

export class RecreationGovAdapter implements BasePlatformAdapter {
  readonly platform = "recreation_gov" as const;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.RECREATION_GOV_API_KEY ?? "";
  }

  async searchCampsites(params: SearchParams): Promise<NormalizedCampsite[]> {
    const searchParams = new URLSearchParams();

    if (params.query) {
      searchParams.set("query", params.query);
    }
    if (params.latitude && params.longitude) {
      searchParams.set("latitude", params.latitude.toString());
      searchParams.set("longitude", params.longitude.toString());
      if (params.radiusMiles) {
        searchParams.set("radius", params.radiusMiles.toString());
      }
    }
    if (params.location) {
      searchParams.set("query", params.location);
    }
    searchParams.set("limit", (params.limit ?? 20).toString());
    searchParams.set(
      "offset",
      (((params.page ?? 1) - 1) * (params.limit ?? 20)).toString()
    );
    searchParams.set("activity", "CAMPING");

    const url = `${RIDB_BASE_URL}/facilities?${searchParams.toString()}`;
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        apikey: this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Recreation.gov API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as RIDBResponse;

    return data.RECDATA.filter((f) => f.Reservable && f.Enabled).map(
      (facility) => this.mapFacilityToCampsite(facility)
    );
  }

  async checkAvailability(
    campgroundId: string,
    startDate: string,
    endDate: string
  ): Promise<AvailabilityResult[]> {
    const startMonth = startDate.substring(0, 7); // YYYY-MM
    const url = `${RECREATION_GOV_API_URL}/availability/campground/${campgroundId}/month?start_date=${startMonth}-01T00:00:00.000Z`;

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "User-Agent": "Camper-App/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Recreation.gov availability error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as AvailabilityResponse;

    const results: AvailabilityResult[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (const [siteId, site] of Object.entries(data.campsites)) {
      const availableDates: string[] = [];

      for (const [dateStr, status] of Object.entries(site.availabilities)) {
        const date = new Date(dateStr);
        if (date >= start && date <= end && status === "Available") {
          availableDates.push(dateStr.split("T")[0]!);
        }
      }

      results.push({
        campsiteId: siteId,
        campgroundId,
        available: availableDates.length > 0,
        availableDates,
      });
    }

    return results;
  }

  async getCampsiteDetails(
    campsiteId: string
  ): Promise<NormalizedCampsite | null> {
    const url = `${RIDB_BASE_URL}/facilities/${campsiteId}`;
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        apikey: this.apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(
        `Recreation.gov API error: ${response.status} ${response.statusText}`
      );
    }

    const facility = (await response.json()) as RIDBFacility;
    return this.mapFacilityToCampsite(facility);
  }

  async getCampgroundDetails(
    campgroundId: string
  ): Promise<Campground | null> {
    const url = `${RIDB_BASE_URL}/facilities/${campgroundId}`;
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        apikey: this.apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(
        `Recreation.gov API error: ${response.status} ${response.statusText}`
      );
    }

    const facility = (await response.json()) as RIDBFacility;
    return this.mapFacilityToCampground(facility);
  }

  private mapFacilityToCampsite(facility: RIDBFacility): NormalizedCampsite {
    const address = facility.ADDRESS?.[0];
    const imageUrl = facility.MEDIA?.find(
      (m) => m.MediaType === "Image"
    )?.URL;

    return {
      id: facility.FacilityID,
      campgroundId: facility.FacilityID,
      campgroundName: facility.FacilityName,
      externalId: facility.FacilityID,
      platform: "recreation_gov",
      name: facility.FacilityName,
      description: facility.FacilityDescription || null,
      siteType: "tent",
      maxOccupancy: 8,
      amenities: facility.ACTIVITY?.map((a) => a.ActivityName) ?? [],
      pricePerNight: 0,
      currency: "USD",
      imageUrls: imageUrl ? [imageUrl] : [],
      latitude: facility.FacilityLatitude,
      longitude: facility.FacilityLongitude,
      region: address?.AddressStateCode ?? "",
      country: "US",
      available: true,
      availableDates: [],
      bookingUrl: facility.FacilityReservationURL || null,
    };
  }

  private mapFacilityToCampground(facility: RIDBFacility): Campground {
    const address = facility.ADDRESS?.[0];
    const imageUrl = facility.MEDIA?.find(
      (m) => m.MediaType === "Image"
    )?.URL;

    return {
      id: facility.FacilityID,
      externalId: facility.FacilityID,
      platform: "recreation_gov",
      name: facility.FacilityName,
      description: facility.FacilityDescription || null,
      region: address?.AddressStateCode ?? "",
      state: address?.AddressStateCode ?? null,
      country: "US",
      latitude: facility.FacilityLatitude,
      longitude: facility.FacilityLongitude,
      amenities: facility.ACTIVITY?.map((a) => a.ActivityName) ?? [],
      totalSites: 0,
      imageUrl: imageUrl ?? null,
      reservationUrl: facility.FacilityReservationURL || null,
    };
  }
}
