import type { Platform } from "@camper/shared-types";

/**
 * Calculate when the booking window opens for a given platform and arrival date.
 *
 * Platform rules:
 * - Ontario Parks: 5 months before arrival at 7:00 AM EST.
 *   Exception: arrival dates Jul 29–31 open on Mar 1 at 7:00 AM EST.
 * - Recreation.gov: 6 months before arrival at midnight EST.
 * - Parks Canada: 5 months before arrival at 8:00 AM EST (approximate).
 */
export function calculateWindowOpensAt(
  platform: Platform,
  arrivalDate: string,
): Date {
  const arrival = new Date(arrivalDate + "T00:00:00");

  switch (platform) {
    case "ontario_parks":
      return calcOntarioParksWindow(arrival);
    case "recreation_gov":
      return calcRecreationGovWindow(arrival);
    case "parks_canada":
      return calcParksCanadaWindow(arrival);
    default:
      throw new Error(`Booking window calculation not supported for platform: ${platform}`);
  }
}

function calcOntarioParksWindow(arrival: Date): Date {
  const month = arrival.getMonth(); // 0-indexed (6 = July)
  const day = arrival.getDate();

  // Exception: Jul 29-31 arrivals open on Mar 1 at 7:00 AM EST
  if (month === 6 && day >= 29) {
    const windowDate = new Date(
      Date.UTC(arrival.getFullYear(), 2, 1, 12, 0, 0), // Mar 1, 12:00 UTC = 7:00 AM EST
    );
    return windowDate;
  }

  // Standard: 5 months before arrival at 7:00 AM EST (12:00 UTC)
  const windowDate = subtractMonths(arrival, 5);
  return new Date(
    Date.UTC(
      windowDate.getFullYear(),
      windowDate.getMonth(),
      windowDate.getDate(),
      12, // 12:00 UTC = 7:00 AM EST
      0,
      0,
    ),
  );
}

function calcRecreationGovWindow(arrival: Date): Date {
  // 6 months before arrival at midnight EST (05:00 UTC)
  const windowDate = subtractMonths(arrival, 6);
  return new Date(
    Date.UTC(
      windowDate.getFullYear(),
      windowDate.getMonth(),
      windowDate.getDate(),
      5, // 05:00 UTC = midnight EST
      0,
      0,
    ),
  );
}

function calcParksCanadaWindow(arrival: Date): Date {
  // 5 months before arrival at 8:00 AM EST (13:00 UTC)
  const windowDate = subtractMonths(arrival, 5);
  return new Date(
    Date.UTC(
      windowDate.getFullYear(),
      windowDate.getMonth(),
      windowDate.getDate(),
      13, // 13:00 UTC = 8:00 AM EST
      0,
      0,
    ),
  );
}

/**
 * Subtract N months from a date, clamping to the last day of the target month
 * if the day doesn't exist (e.g., Oct 31 minus 5 months = May 31).
 */
function subtractMonths(date: Date, months: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const targetMonth = month - months;
  const targetDate = new Date(year, targetMonth, 1);

  // Clamp day to last day of target month
  const lastDay = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth() + 1,
    0,
  ).getDate();

  targetDate.setDate(Math.min(day, lastDay));
  return targetDate;
}

/**
 * Calculate the pre-staging time (3 minutes before window opens).
 */
export function calculatePreStageAt(windowOpensAt: Date): Date {
  return new Date(windowOpensAt.getTime() - 3 * 60 * 1000);
}

/**
 * Check if a platform supports snipe booking.
 */
export function supportsSnipeBooking(platform: Platform): boolean {
  return ["ontario_parks", "recreation_gov", "parks_canada"].includes(platform);
}
