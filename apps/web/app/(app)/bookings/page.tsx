"use client";

import { useState } from "react";
import {
  CalendarCheck,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Calendar,
  Tent,
} from "lucide-react";
import { cn } from "@/lib/utils";

type BookingStatus = "pending" | "confirmed" | "cancelled";
type Tab = "upcoming" | "past";

interface MockBooking {
  id: string;
  campsiteName: string;
  campgroundName: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  status: BookingStatus;
  bookingUrl: string | null;
  isPast: boolean;
}

const mockBookings: MockBooking[] = [
  {
    id: "1",
    campsiteName: "Site 42 — Riverside",
    campgroundName: "Yosemite Upper Pines",
    startDate: "2026-06-15",
    endDate: "2026-06-18",
    totalCost: 105,
    status: "confirmed",
    bookingUrl: "https://recreation.gov",
    isPast: false,
  },
  {
    id: "2",
    campsiteName: "Pine Cabin 3",
    campgroundName: "Sequoia National Forest",
    startDate: "2026-07-20",
    endDate: "2026-07-23",
    totalCost: 360,
    status: "pending",
    bookingUrl: null,
    isPast: false,
  },
  {
    id: "3",
    campsiteName: "Site 8 — Meadow",
    campgroundName: "Glacier National Park",
    startDate: "2025-09-10",
    endDate: "2025-09-13",
    totalCost: 90,
    status: "confirmed",
    bookingUrl: "https://recreation.gov",
    isPast: true,
  },
  {
    id: "4",
    campsiteName: "Lot A-7 — Full Hookup",
    campgroundName: "Joshua Tree Black Rock",
    startDate: "2025-08-01",
    endDate: "2025-08-04",
    totalCost: 165,
    status: "cancelled",
    bookingUrl: null,
    isPast: true,
  },
];

const statusConfig: Record<
  BookingStatus,
  { label: string; icon: typeof Clock; className: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-accent-50 text-accent-700 border-accent-200",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    className: "bg-primary-50 text-primary-700 border-primary-200",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-stone-50 text-stone-500 border-stone-200",
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function nightsBetween(start: string, end: string) {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  const filtered = mockBookings.filter((b) =>
    activeTab === "upcoming" ? !b.isPast : b.isPast
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-stone-900">Bookings</h2>
        </div>

        {/* ── Tabs ── */}
        <div className="mt-6 flex gap-1 rounded-lg border border-stone-200 bg-stone-100 p-1">
          {(["upcoming", "past"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Booking Cards ── */}
        {filtered.length > 0 ? (
          <div className="mt-6 space-y-4">
            {filtered.map((booking) => {
              const status = statusConfig[booking.status];
              const StatusIcon = status.icon;
              const nights = nightsBetween(booking.startDate, booking.endDate);

              return (
                <div
                  key={booking.id}
                  className="rounded-2xl border border-stone-200 bg-white p-5 transition-all hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                        <Tent className="h-6 w-6 text-primary-600" />
                      </div>

                      {/* Details */}
                      <div>
                        <h3 className="font-semibold text-stone-900">
                          {booking.campsiteName}
                        </h3>
                        <p className="mt-0.5 flex items-center gap-1 text-sm text-stone-500">
                          <MapPin className="h-3 w-3" />
                          {booking.campgroundName}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-stone-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-stone-400" />
                            {formatDate(booking.startDate)} &mdash;{" "}
                            {formatDate(booking.endDate)}
                          </span>
                          <span className="text-stone-300">|</span>
                          <span>
                            {nights} {nights === 1 ? "night" : "nights"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status + Price */}
                    <div className="flex items-start gap-4 sm:flex-col sm:items-end">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                          status.className
                        )}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                      <p className="text-lg font-bold text-stone-900">
                        ${booking.totalCost.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {booking.bookingUrl && (
                    <div className="mt-4 border-t border-stone-100 pt-3">
                      <a
                        href={booking.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        View on booking platform
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Empty State ── */
          <div className="mt-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100">
              <CalendarCheck className="h-8 w-8 text-stone-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-stone-900">
              No {activeTab} bookings
            </h3>
            <p className="mt-1 text-sm text-stone-500">
              {activeTab === "upcoming"
                ? "When you book a campsite, it will appear here."
                : "Your past bookings will be shown here."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
