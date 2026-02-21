import { z } from "zod";

export const platformSchema = z.enum([
  "recreation_gov",
  "parks_canada",
  "ontario_parks",
  "reserve_america",
  "hipcamp",
  "glamping_hub",
  "tentrr",
]);

export const siteTypeSchema = z.enum([
  "tent",
  "rv",
  "cabin",
  "yurt",
  "glamping",
  "backcountry",
  "group",
]);

export const campgroundSchema = z.object({
  id: z.string(),
  externalId: z.string(),
  platform: platformSchema,
  name: z.string(),
  description: z.string().nullable(),
  region: z.string(),
  state: z.string().nullable(),
  country: z.enum(["US", "CA"]),
  latitude: z.number(),
  longitude: z.number(),
  amenities: z.array(z.string()),
  totalSites: z.number().int(),
  imageUrl: z.string().url().nullable(),
  reservationUrl: z.string().url().nullable(),
});

export const normalizedCampsiteSchema = z.object({
  id: z.string(),
  campgroundId: z.string(),
  campgroundName: z.string(),
  externalId: z.string(),
  platform: platformSchema,
  name: z.string(),
  description: z.string().nullable(),
  siteType: siteTypeSchema,
  maxOccupancy: z.number().int(),
  amenities: z.array(z.string()),
  pricePerNight: z.number(),
  currency: z.enum(["USD", "CAD"]),
  imageUrls: z.array(z.string().url()),
  latitude: z.number(),
  longitude: z.number(),
  region: z.string(),
  country: z.enum(["US", "CA"]),
  available: z.boolean(),
  availableDates: z.array(z.string()),
  bookingUrl: z.string().url().nullable(),
});

export const searchCampsitesInputSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radiusMiles: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  siteTypes: z.array(siteTypeSchema).optional(),
  groupSize: z.number().int().min(1).optional(),
  amenities: z.array(z.string()).optional(),
  maxPricePerNight: z.number().optional(),
  platforms: z.array(platformSchema).optional(),
  country: z.enum(["US", "CA"]).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export const searchCampsitesOutputSchema = z.object({
  results: z.array(normalizedCampsiteSchema),
  total: z.number().int(),
  page: z.number().int(),
  totalPages: z.number().int(),
});
