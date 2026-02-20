"use client";

import { useState } from "react";
import {
  Bell,
  Plus,
  Pause,
  Play,
  X,
  Radar,
  CirclePause,
  Zap,
  MapPin,
  Calendar,
  Tent,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AlertStatus = "active" | "paused" | "triggered";

interface MockAlert {
  id: string;
  campgroundName: string;
  startDate: string;
  endDate: string;
  siteTypes: string[];
  autoBook: boolean;
  status: AlertStatus;
  lastScannedAt: string | null;
  scanInterval: string;
}

const mockAlerts: MockAlert[] = [
  {
    id: "1",
    campgroundName: "Yosemite Upper Pines",
    startDate: "2026-07-04",
    endDate: "2026-07-07",
    siteTypes: ["tent"],
    autoBook: true,
    status: "active",
    lastScannedAt: "2 min ago",
    scanInterval: "1 min",
  },
  {
    id: "2",
    campgroundName: "Glacier National Park — Apgar",
    startDate: "2026-08-10",
    endDate: "2026-08-14",
    siteTypes: ["tent", "rv"],
    autoBook: false,
    status: "active",
    lastScannedAt: "5 min ago",
    scanInterval: "15 min",
  },
  {
    id: "3",
    campgroundName: "Big Sur Kirk Creek",
    startDate: "2026-06-20",
    endDate: "2026-06-22",
    siteTypes: ["tent"],
    autoBook: false,
    status: "paused",
    lastScannedAt: "3 hours ago",
    scanInterval: "15 min",
  },
  {
    id: "4",
    campgroundName: "Joshua Tree Black Rock",
    startDate: "2026-05-15",
    endDate: "2026-05-18",
    siteTypes: ["rv"],
    autoBook: true,
    status: "triggered",
    lastScannedAt: "1 hour ago",
    scanInterval: "1 min",
  },
];

const statusConfig: Record<
  AlertStatus,
  {
    label: string;
    icon: typeof Radar;
    className: string;
    dotClass: string;
  }
> = {
  active: {
    label: "Scanning",
    icon: Radar,
    className: "bg-primary-50 text-primary-700 border-primary-200",
    dotClass: "bg-primary-500",
  },
  paused: {
    label: "Paused",
    icon: CirclePause,
    className: "bg-stone-50 text-stone-500 border-stone-200",
    dotClass: "bg-stone-400",
  },
  triggered: {
    label: "Triggered",
    icon: Zap,
    className: "bg-accent-50 text-accent-700 border-accent-200",
    dotClass: "bg-accent-500",
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(mockAlerts);

  const handlePause = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "paused" as const } : a))
    );
  };

  const handleResume = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "active" as const } : a))
    );
  };

  const handleCancel = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-stone-900">Alerts</h2>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700">
            <Plus className="h-4 w-4" />
            Create Alert
          </button>
        </div>

        {/* ── Alert Summary ── */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            {
              label: "Active",
              count: alerts.filter((a) => a.status === "active").length,
              color: "text-primary-600",
            },
            {
              label: "Paused",
              count: alerts.filter((a) => a.status === "paused").length,
              color: "text-stone-500",
            },
            {
              label: "Triggered",
              count: alerts.filter((a) => a.status === "triggered").length,
              color: "text-accent-600",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-stone-200 bg-white p-4 text-center"
            >
              <p className={cn("text-2xl font-bold", stat.color)}>
                {stat.count}
              </p>
              <p className="text-xs font-medium text-stone-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Alert Cards ── */}
        {alerts.length > 0 ? (
          <div className="mt-6 space-y-4">
            {alerts.map((alert) => {
              const status = statusConfig[alert.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={alert.id}
                  className="rounded-2xl border border-stone-200 bg-white p-5 transition-all hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      {/* Indicator */}
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-stone-50">
                        <Bell className="h-6 w-6 text-stone-400" />
                        <span
                          className={cn(
                            "absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white",
                            status.dotClass
                          )}
                        />
                      </div>

                      {/* Details */}
                      <div>
                        <h3 className="font-semibold text-stone-900">
                          {alert.campgroundName}
                        </h3>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-stone-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-stone-400" />
                            {formatDate(alert.startDate)} &mdash;{" "}
                            {formatDate(alert.endDate)}
                          </span>
                          <span className="text-stone-300">|</span>
                          <span className="flex items-center gap-1">
                            <Tent className="h-3.5 w-3.5 text-stone-400" />
                            {alert.siteTypes.join(", ")}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-3 text-xs text-stone-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Scans every {alert.scanInterval}
                          </span>
                          {alert.lastScannedAt && (
                            <>
                              <span className="text-stone-300">|</span>
                              <span>Last checked {alert.lastScannedAt}</span>
                            </>
                          )}
                          {alert.autoBook && (
                            <>
                              <span className="text-stone-300">|</span>
                              <span className="flex items-center gap-1 font-medium text-accent-600">
                                <Zap className="h-3 w-3" />
                                Auto-book
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                        status.className
                      )}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2 border-t border-stone-100 pt-3">
                    {alert.status === "active" && (
                      <button
                        onClick={() => handlePause(alert.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50"
                      >
                        <Pause className="h-3 w-3" />
                        Pause
                      </button>
                    )}
                    {alert.status === "paused" && (
                      <button
                        onClick={() => handleResume(alert.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100"
                      >
                        <Play className="h-3 w-3" />
                        Resume
                      </button>
                    )}
                    <button
                      onClick={() => handleCancel(alert.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-red-50"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Empty State ── */
          <div className="mt-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100">
              <Bell className="h-8 w-8 text-stone-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-stone-900">
              No active alerts
            </h3>
            <p className="mt-1 text-sm text-stone-500">
              Create an alert to start monitoring campsites for availability.
            </p>
            <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700">
              <Plus className="h-4 w-4" />
              Create Your First Alert
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
