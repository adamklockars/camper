"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Bell,
  Smartphone,
  Moon,
  CreditCard,
  Trash2,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
        enabled ? "bg-primary-600" : "bg-stone-300"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          enabled ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [name, setName] = useState("Alex Camper");
  const [email, setEmail] = useState("alex@example.com");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-stone-900">Settings</h2>

        {/* ── Profile ── */}
        <section className="mt-8">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-stone-400" />
            <h3 className="text-lg font-semibold text-stone-900">Profile</h3>
          </div>

          <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-stone-700"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-stone-700"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            <div className="mt-6">
              <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700">
                Save Changes
              </button>
            </div>
          </div>
        </section>

        {/* ── Notifications ── */}
        <section className="mt-8">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-stone-400" />
            <h3 className="text-lg font-semibold text-stone-900">
              Notification Preferences
            </h3>
          </div>

          <div className="mt-4 rounded-2xl border border-stone-200 bg-white divide-y divide-stone-100">
            {/* Push */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100">
                  <Bell className="h-5 w-5 text-stone-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    Push Notifications
                  </p>
                  <p className="text-xs text-stone-500">
                    Receive browser push notifications for alerts
                  </p>
                </div>
              </div>
              <Toggle
                enabled={pushEnabled}
                onToggle={() => setPushEnabled(!pushEnabled)}
              />
            </div>

            {/* Email */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100">
                  <Mail className="h-5 w-5 text-stone-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    Email Notifications
                  </p>
                  <p className="text-xs text-stone-500">
                    Receive email notifications for alert triggers and bookings
                  </p>
                </div>
              </div>
              <Toggle
                enabled={emailEnabled}
                onToggle={() => setEmailEnabled(!emailEnabled)}
              />
            </div>

            {/* SMS */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100">
                  <Smartphone className="h-5 w-5 text-stone-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    SMS Notifications
                  </p>
                  <p className="text-xs text-stone-500">
                    Get text messages when a campsite becomes available
                  </p>
                  {!smsEnabled && (
                    <p className="mt-1 text-xs font-medium text-accent-600">
                      Premium feature
                    </p>
                  )}
                </div>
              </div>
              <Toggle
                enabled={smsEnabled}
                onToggle={() => setSmsEnabled(!smsEnabled)}
              />
            </div>
          </div>
        </section>

        {/* ── Quiet Hours ── */}
        <section className="mt-8">
          <div className="flex items-center gap-3">
            <Moon className="h-5 w-5 text-stone-400" />
            <h3 className="text-lg font-semibold text-stone-900">
              Quiet Hours
            </h3>
          </div>

          <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-900">
                  Enable Quiet Hours
                </p>
                <p className="text-xs text-stone-500">
                  Silence notifications during set hours
                </p>
              </div>
              <Toggle
                enabled={quietHoursEnabled}
                onToggle={() => setQuietHoursEnabled(!quietHoursEnabled)}
              />
            </div>

            {quietHoursEnabled && (
              <div className="mt-4 flex items-center gap-4 border-t border-stone-100 pt-4">
                <div>
                  <label className="block text-xs font-medium text-stone-500">
                    From
                  </label>
                  <input
                    type="time"
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                    className="mt-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </div>
                <span className="mt-5 text-sm text-stone-400">to</span>
                <div>
                  <label className="block text-xs font-medium text-stone-500">
                    Until
                  </label>
                  <input
                    type="time"
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                    className="mt-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Subscription ── */}
        <section className="mt-8">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-stone-400" />
            <h3 className="text-lg font-semibold text-stone-900">
              Subscription
            </h3>
          </div>

          <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-stone-900">
                    Free Plan
                  </p>
                  <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-semibold text-stone-600">
                    Current
                  </span>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  3 alerts, email notifications, 15-minute scan intervals
                </p>
              </div>
              <button className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-600">
                Upgrade to Premium
              </button>
            </div>
          </div>
        </section>

        {/* ── Danger Zone ── */}
        <section className="mt-8 mb-12">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-error" />
            <h3 className="text-lg font-semibold text-error">Danger Zone</h3>
          </div>

          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-900">
                  Delete Account
                </p>
                <p className="text-xs text-stone-500">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>
              </div>
              <button className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-error transition-colors hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
