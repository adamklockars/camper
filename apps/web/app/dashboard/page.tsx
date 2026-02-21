"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trees, LogOut, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/auth/signin");
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/signin");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Trees className="h-7 w-7 text-primary-600" />
            <span className="text-xl font-bold text-stone-900">Camper</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-stone-600">{session.user.name}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900">
            Welcome back, {session.user.name?.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Here&apos;s what&apos;s happening with your campsites.
          </p>
        </div>

        {/* Placeholder cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <h3 className="text-sm font-medium text-stone-500">Active Alerts</h3>
            <p className="mt-2 text-3xl font-bold text-stone-900">0</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <h3 className="text-sm font-medium text-stone-500">Saved Campsites</h3>
            <p className="mt-2 text-3xl font-bold text-stone-900">0</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <h3 className="text-sm font-medium text-stone-500">Upcoming Trips</h3>
            <p className="mt-2 text-3xl font-bold text-stone-900">0</p>
          </div>
        </div>
      </main>
    </div>
  );
}
