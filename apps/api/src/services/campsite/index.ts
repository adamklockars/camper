import type { NormalizedCampsite, Campground, Platform } from "@camper/shared-types";
import type { BasePlatformAdapter, SearchParams } from "../../integrations/base-adapter.js";
import { RecreationGovAdapter } from "../../integrations/recreation-gov/index.js";
import { HipcampAdapter } from "../../integrations/hipcamp/index.js";
import { ParksCanadaAdapter } from "../../integrations/parks-canada/index.js";

const adapters: Map<Platform, BasePlatformAdapter> = new Map();

function getAdapter(platform: Platform): BasePlatformAdapter | undefined {
  return adapters.get(platform);
}

function initAdapters(): void {
  if (adapters.size > 0) return;
  adapters.set("recreation_gov", new RecreationGovAdapter());
  adapters.set("hipcamp", new HipcampAdapter());
  adapters.set("parks_canada", new ParksCanadaAdapter());
}

export interface SearchCampsitesParams extends SearchParams {
  platforms?: Platform[];
  country?: "US" | "CA";
}

export interface SearchCampsitesResult {
  results: NormalizedCampsite[];
  total: number;
  page: number;
  totalPages: number;
}

export async function searchCampsites(
  params: SearchCampsitesParams
): Promise<SearchCampsitesResult> {
  initAdapters();

  const platformsToSearch = params.platforms ?? Array.from(adapters.keys());
  const limit = params.limit ?? 20;
  const page = params.page ?? 1;

  // Query all selected adapters in parallel
  const searchPromises = platformsToSearch.map(async (platform) => {
    const adapter = getAdapter(platform);
    if (!adapter) return [];
    try {
      return await adapter.searchCampsites(params);
    } catch (error) {
      console.error(`Error searching ${platform}:`, error);
      return [];
    }
  });

  const allResults = (await Promise.all(searchPromises)).flat();

  // Deduplicate by externalId + platform
  const seen = new Set<string>();
  const deduplicated = allResults.filter((site) => {
    const key = `${site.platform}:${site.externalId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Apply filters that the adapters might not handle uniformly
  let filtered = deduplicated;

  if (params.siteTypes && params.siteTypes.length > 0) {
    filtered = filtered.filter((s) =>
      params.siteTypes!.includes(s.siteType)
    );
  }

  if (params.maxPricePerNight != null) {
    filtered = filtered.filter(
      (s) => s.pricePerNight <= params.maxPricePerNight!
    );
  }

  if (params.groupSize != null) {
    filtered = filtered.filter(
      (s) => s.maxOccupancy >= params.groupSize!
    );
  }

  if (params.country) {
    filtered = filtered.filter((s) => s.country === params.country);
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIdx = (page - 1) * limit;
  const results = filtered.slice(startIdx, startIdx + limit);

  return {
    results,
    total,
    page,
    totalPages,
  };
}

export async function getCampsite(
  platform: Platform,
  campsiteId: string
): Promise<NormalizedCampsite | null> {
  initAdapters();
  const adapter = getAdapter(platform);
  if (!adapter) return null;
  return adapter.getCampsiteDetails(campsiteId);
}

export async function getCampground(
  platform: Platform,
  campgroundId: string
): Promise<Campground | null> {
  initAdapters();
  const adapter = getAdapter(platform);
  if (!adapter) return null;
  return adapter.getCampgroundDetails(campgroundId);
}

export async function checkAvailability(
  platform: Platform,
  campgroundId: string,
  startDate: string,
  endDate: string
) {
  initAdapters();
  const adapter = getAdapter(platform);
  if (!adapter) return [];
  return adapter.checkAvailability(campgroundId, startDate, endDate);
}
