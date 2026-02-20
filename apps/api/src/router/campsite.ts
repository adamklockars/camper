import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";
import {
  searchCampsitesInputSchema,
  platformSchema,
} from "@camper/shared-types";
import {
  searchCampsites,
  getCampsite,
  getCampground,
} from "../services/campsite/index.js";
import type { Platform } from "@camper/shared-types";

export const campsiteRouter = router({
  search: publicProcedure
    .input(searchCampsitesInputSchema)
    .query(async ({ input }) => {
      const result = await searchCampsites({
        query: input.query,
        location: input.location,
        latitude: input.latitude,
        longitude: input.longitude,
        radiusMiles: input.radiusMiles,
        startDate: input.startDate,
        endDate: input.endDate,
        siteTypes: input.siteTypes,
        groupSize: input.groupSize,
        amenities: input.amenities,
        maxPricePerNight: input.maxPricePerNight,
        platforms: input.platforms,
        country: input.country,
        page: input.page,
        limit: input.limit,
      });
      return result;
    }),

  getCampsite: publicProcedure
    .input(
      z.object({
        platform: platformSchema,
        campsiteId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const campsite = await getCampsite(
        input.platform as Platform,
        input.campsiteId
      );
      return campsite;
    }),

  getCampground: publicProcedure
    .input(
      z.object({
        platform: platformSchema,
        campgroundId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const campground = await getCampground(
        input.platform as Platform,
        input.campgroundId
      );
      return campground;
    }),
});
