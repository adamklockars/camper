import Link from "next/link";
import {
  MessageSquare,
  Globe,
  Bell,
  Tent,
  ArrowRight,
  MapPin,
  Shield,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "AI Chat",
    description:
      "Ask your AI assistant to find campsites, plan trips, and manage bookings — all through natural conversation.",
  },
  {
    icon: Globe,
    title: "Cross-Border Search",
    description:
      "Search across Recreation.gov, Reserve California, BC Parks, Parks Canada, and more in one unified experience.",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description:
      "Set up monitoring for sold-out sites. Get instant notifications when your dream campsite opens up.",
  },
  {
    icon: Tent,
    title: "All Camping Styles",
    description:
      "From tent sites to RV hookups, cabins to backcountry permits — find every type of camping accommodation.",
  },
];

const stats = [
  { value: "500K+", label: "Campsites" },
  { value: "US & Canada", label: "Coverage" },
  { value: "24/7", label: "Monitoring" },
];

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-primary-100/40 blur-3xl" />
          <div className="absolute -bottom-20 left-0 h-[400px] w-[400px] rounded-full bg-accent-100/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700">
              <Zap className="h-3.5 w-3.5" />
              Now with AI-powered trip planning
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
              Your AI{" "}
              <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                Camping Assistant
              </span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-stone-600 sm:text-xl">
              Find, monitor, and book campsites across the US and Canada.
              Our AI assistant helps you discover the perfect spot, sets up
              smart alerts for sold-out sites, and can even auto-book when
              a cancellation opens up.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/30"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-8 py-3.5 text-base font-semibold text-stone-700 shadow-sm transition-colors hover:bg-stone-50"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-extrabold text-primary-600">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm font-medium text-stone-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              Everything you need to camp smarter
            </h2>
            <p className="mt-4 text-lg text-stone-600">
              Powered by AI and real-time data from government booking platforms
              across North America.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-stone-200 bg-white p-6 transition-all hover:border-primary-200 hover:shadow-lg hover:shadow-primary-100/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-stone-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="bg-stone-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-stone-600">
              Get from idea to campsite in three simple steps.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-3">
            {[
              {
                step: "1",
                icon: MessageSquare,
                title: "Tell us what you want",
                description:
                  "Chat with our AI assistant about your ideal camping trip — dates, location, group size, amenities, and more.",
              },
              {
                step: "2",
                icon: MapPin,
                title: "We find the best options",
                description:
                  "Our engine searches across all major platforms and surfaces the perfect sites for your needs.",
              },
              {
                step: "3",
                icon: Shield,
                title: "Book or set an alert",
                description:
                  "Book available sites instantly, or set a smart alert to watch sold-out sites for cancellations.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-100 text-accent-700">
                  <span className="text-xl font-bold">{item.step}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-stone-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-primary-700 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to find your next campsite?
          </h2>
          <p className="mt-4 text-lg text-primary-200">
            Join thousands of campers who use Camper to discover and book
            the best sites across North America.
          </p>
          <Link
            href="/auth/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary-700 shadow-lg transition-all hover:bg-primary-50"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
