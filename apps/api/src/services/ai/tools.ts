import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";

// ─── Zod schemas for tool inputs ────────────────────────────────────────────

export const searchCampsitesToolInput = z.object({
  query: z.string().optional().describe("Search query or campground name"),
  location: z
    .string()
    .optional()
    .describe("Location name (e.g., 'Yosemite', 'Colorado')"),
  latitude: z.number().optional().describe("Latitude for geo search"),
  longitude: z.number().optional().describe("Longitude for geo search"),
  radiusMiles: z
    .number()
    .optional()
    .describe("Search radius in miles from coordinates"),
  startDate: z
    .string()
    .optional()
    .describe("Check-in date in YYYY-MM-DD format"),
  endDate: z
    .string()
    .optional()
    .describe("Check-out date in YYYY-MM-DD format"),
  siteTypes: z
    .array(z.string())
    .optional()
    .describe("Preferred site types: tent, rv, cabin, yurt, glamping, backcountry, group"),
  groupSize: z.number().optional().describe("Number of people in the group"),
  amenities: z
    .array(z.string())
    .optional()
    .describe("Required amenities (e.g., 'showers', 'electricity')"),
  maxPricePerNight: z
    .number()
    .optional()
    .describe("Maximum budget per night in USD"),
});

export const createAlertToolInput = z.object({
  campgroundId: z.string().describe("The campground ID to watch"),
  platform: z
    .string()
    .describe("Platform: recreation_gov, parks_canada, hipcamp, etc."),
  startDate: z.string().describe("Start date in YYYY-MM-DD format"),
  endDate: z.string().describe("End date in YYYY-MM-DD format"),
  siteTypes: z
    .array(z.string())
    .optional()
    .describe("Preferred site types to watch for"),
  autoBook: z
    .boolean()
    .optional()
    .describe("Whether to auto-book when available"),
});

export const updatePreferencesToolInput = z.object({
  preferredRegions: z
    .array(z.string())
    .optional()
    .describe("Preferred camping regions"),
  groupSize: z
    .number()
    .optional()
    .describe("Typical group size"),
  siteTypes: z
    .array(z.string())
    .optional()
    .describe("Preferred site types"),
  amenityPreferences: z
    .array(z.string())
    .optional()
    .describe("Preferred amenities"),
  budgetMin: z
    .number()
    .optional()
    .describe("Minimum budget per night"),
  budgetMax: z
    .number()
    .optional()
    .describe("Maximum budget per night"),
  petsAllowed: z
    .boolean()
    .optional()
    .describe("Whether user brings pets"),
});

export const getCampgroundInfoToolInput = z.object({
  campgroundId: z.string().describe("Campground ID"),
  platform: z
    .string()
    .describe("Platform the campground is on"),
});

export const suggestAlternativesToolInput = z.object({
  location: z
    .string()
    .describe("Location or region to search near"),
  startDate: z.string().describe("Desired start date"),
  endDate: z.string().describe("Desired end date"),
  siteTypes: z
    .array(z.string())
    .optional()
    .describe("Preferred site types"),
  maxPricePerNight: z
    .number()
    .optional()
    .describe("Max budget per night"),
});

export const getBookingDetailsToolInput = z.object({
  bookingId: z.string().describe("The booking ID to look up"),
});

export const cancelBookingToolInput = z.object({
  bookingId: z.string().describe("The booking ID to cancel"),
});

// ─── Anthropic tool definitions ─────────────────────────────────────────────

export const toolDefinitions: Anthropic.Tool[] = [
  {
    name: "search_campsites",
    description:
      "Search for campsites across multiple platforms by location, dates, amenities, group size, and budget. Returns a list of matching campsites with availability information.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query or campground name",
        },
        location: {
          type: "string",
          description: "Location name (e.g., 'Yosemite', 'Colorado')",
        },
        latitude: {
          type: "number",
          description: "Latitude for geo search",
        },
        longitude: {
          type: "number",
          description: "Longitude for geo search",
        },
        radiusMiles: {
          type: "number",
          description: "Search radius in miles",
        },
        startDate: {
          type: "string",
          description: "Check-in date YYYY-MM-DD",
        },
        endDate: {
          type: "string",
          description: "Check-out date YYYY-MM-DD",
        },
        siteTypes: {
          type: "array",
          items: { type: "string" },
          description: "Preferred site types",
        },
        groupSize: {
          type: "number",
          description: "Number of people",
        },
        amenities: {
          type: "array",
          items: { type: "string" },
          description: "Required amenities",
        },
        maxPricePerNight: {
          type: "number",
          description: "Max budget per night in USD",
        },
      },
    },
  },
  {
    name: "create_availability_alert",
    description:
      "Create an availability alert that monitors a campground for open sites. The user will be notified when matching campsites become available.",
    input_schema: {
      type: "object" as const,
      properties: {
        campgroundId: {
          type: "string",
          description: "Campground ID to monitor",
        },
        platform: {
          type: "string",
          description: "Platform: recreation_gov, parks_canada, hipcamp",
        },
        startDate: {
          type: "string",
          description: "Start date YYYY-MM-DD",
        },
        endDate: {
          type: "string",
          description: "End date YYYY-MM-DD",
        },
        siteTypes: {
          type: "array",
          items: { type: "string" },
          description: "Site types to watch for",
        },
        autoBook: {
          type: "boolean",
          description: "Auto-book when available",
        },
      },
      required: ["campgroundId", "platform", "startDate", "endDate"],
    },
  },
  {
    name: "update_user_preferences",
    description:
      "Update the user's camping preferences for better future recommendations.",
    input_schema: {
      type: "object" as const,
      properties: {
        preferredRegions: {
          type: "array",
          items: { type: "string" },
          description: "Preferred regions",
        },
        groupSize: {
          type: "number",
          description: "Typical group size",
        },
        siteTypes: {
          type: "array",
          items: { type: "string" },
          description: "Preferred site types",
        },
        amenityPreferences: {
          type: "array",
          items: { type: "string" },
          description: "Preferred amenities",
        },
        budgetMin: {
          type: "number",
          description: "Min budget per night",
        },
        budgetMax: {
          type: "number",
          description: "Max budget per night",
        },
        petsAllowed: {
          type: "boolean",
          description: "User brings pets",
        },
      },
    },
  },
  {
    name: "get_campground_info",
    description:
      "Get detailed information about a specific campground including amenities, location, and general availability.",
    input_schema: {
      type: "object" as const,
      properties: {
        campgroundId: {
          type: "string",
          description: "Campground ID",
        },
        platform: {
          type: "string",
          description: "Platform the campground is on",
        },
      },
      required: ["campgroundId", "platform"],
    },
  },
  {
    name: "suggest_alternatives",
    description:
      "Find alternative campgrounds near a location when the user's preferred campground is unavailable.",
    input_schema: {
      type: "object" as const,
      properties: {
        location: {
          type: "string",
          description: "Location or region",
        },
        startDate: {
          type: "string",
          description: "Start date YYYY-MM-DD",
        },
        endDate: {
          type: "string",
          description: "End date YYYY-MM-DD",
        },
        siteTypes: {
          type: "array",
          items: { type: "string" },
          description: "Preferred site types",
        },
        maxPricePerNight: {
          type: "number",
          description: "Max budget per night",
        },
      },
      required: ["location", "startDate", "endDate"],
    },
  },
  {
    name: "get_booking_details",
    description:
      "Retrieve details of an existing booking by ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        bookingId: {
          type: "string",
          description: "Booking ID",
        },
      },
      required: ["bookingId"],
    },
  },
  {
    name: "cancel_booking",
    description:
      "Cancel an existing booking by ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        bookingId: {
          type: "string",
          description: "Booking ID to cancel",
        },
      },
      required: ["bookingId"],
    },
  },
];
