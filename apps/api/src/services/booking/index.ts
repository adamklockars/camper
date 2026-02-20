import { eq, and, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { bookings, campsites } from "../../db/schema/index.js";

export interface CreateBookingParams {
  userId: string;
  campsiteId: string;
  startDate: string;
  endDate: string;
  alertId?: string;
}

export async function createBooking(params: CreateBookingParams) {
  // Look up the campsite in our database to get details
  const campsite = await db.query.campsites.findFirst({
    where: eq(campsites.id, params.campsiteId),
    with: { campground: true },
  });

  // Calculate number of nights
  const start = new Date(params.startDate);
  const end = new Date(params.endDate);
  const nights = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  const pricePerNight = campsite
    ? parseFloat(campsite.pricePerNight ?? "0")
    : 0;
  const totalCost = (pricePerNight * nights).toFixed(2);

  const [booking] = await db
    .insert(bookings)
    .values({
      userId: params.userId,
      alertId: params.alertId ?? null,
      campsiteId: params.campsiteId,
      campsiteName: campsite?.name ?? "Unknown Site",
      campgroundName: campsite?.campground?.name ?? "Unknown Campground",
      platform: campsite?.campground?.platform ?? "recreation_gov",
      startDate: params.startDate,
      endDate: params.endDate,
      totalCost: totalCost,
      currency: campsite?.currency ?? "USD",
      status: "pending",
      bookingUrl: campsite?.bookingUrl,
    })
    .returning();

  return booking!;
}

export async function listBookings(userId: string) {
  return db.query.bookings.findMany({
    where: eq(bookings.userId, userId),
    orderBy: [desc(bookings.createdAt)],
  });
}

export async function getBooking(bookingId: string, userId: string) {
  return db.query.bookings.findFirst({
    where: and(eq(bookings.id, bookingId), eq(bookings.userId, userId)),
  });
}

export async function cancelBooking(bookingId: string, userId: string) {
  const booking = await getBooking(bookingId, userId);
  if (!booking) {
    throw new Error("Booking not found");
  }
  if (booking.status === "cancelled") {
    throw new Error("Booking is already cancelled");
  }

  const [updated] = await db
    .update(bookings)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
    .returning();

  return updated!;
}

export async function updateBookingStatus(
  bookingId: string,
  status: "pending" | "confirmed" | "cancelled" | "failed",
  externalBookingId?: string
) {
  const values: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };
  if (externalBookingId) {
    values.externalBookingId = externalBookingId;
  }

  const [updated] = await db
    .update(bookings)
    .set(values)
    .where(eq(bookings.id, bookingId))
    .returning();

  return updated!;
}
