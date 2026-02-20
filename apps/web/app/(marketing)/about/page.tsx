import { Trees, MapPin, Bot, Puzzle } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* ── Hero ── */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
            <Trees className="h-8 w-8 text-primary-700" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
            Making camping accessible to everyone
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-stone-600">
            We believe that experiencing the outdoors should be simple, not
            stressful. Camper exists to remove the frustration from finding and
            booking campsites so you can focus on what matters — being in nature.
          </p>
        </div>
      </section>

      {/* ── The Problem ── */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-accent-200 bg-accent-50 px-4 py-1.5 text-sm font-medium text-accent-700">
                <Puzzle className="h-3.5 w-3.5" />
                The Problem
              </div>
              <h2 className="mt-4 text-3xl font-extrabold text-stone-900">
                Camping booking is broken
              </h2>
              <div className="mt-6 space-y-4 text-stone-600">
                <p>
                  Booking a campsite today means juggling dozens of separate
                  websites — Recreation.gov, Reserve California, BC Parks, Parks
                  Canada, and countless state and provincial platforms. Each has
                  its own interface, availability calendar, and booking quirks.
                </p>
                <p>
                  Popular sites sell out within minutes of their booking windows
                  opening. If you miss that window, your only option is to
                  constantly refresh the page hoping for a cancellation. There is
                  no unified search, no smart alerting, and no help navigating the
                  complexity.
                </p>
                <p>
                  The result is a fragmented, stressful experience that
                  discourages people from camping altogether — or limits them to
                  whatever happens to be available at the last minute.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-8">
              <h3 className="text-lg font-semibold text-stone-900">
                Campers face real challenges
              </h3>
              <ul className="mt-6 space-y-4">
                {[
                  {
                    stat: "50+",
                    label: "Different booking platforms across US & Canada",
                  },
                  {
                    stat: "< 5 min",
                    label: "How fast popular sites sell out on release day",
                  },
                  {
                    stat: "Hours",
                    label: "Spent manually refreshing pages for cancellations",
                  },
                  {
                    stat: "Zero",
                    label: "Unified tools that search across all platforms",
                  },
                ].map((item) => (
                  <li key={item.stat} className="flex items-start gap-4">
                    <span className="shrink-0 text-2xl font-extrabold text-accent-600">
                      {item.stat}
                    </span>
                    <span className="text-sm text-stone-600">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Solution ── */}
      <section className="bg-stone-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700">
              <Bot className="h-3.5 w-3.5" />
              The Solution
            </div>
            <h2 className="mt-4 text-3xl font-extrabold text-stone-900">
              An AI-powered camping assistant
            </h2>
            <p className="mt-4 text-lg text-stone-600">
              Camper brings together every major camping platform into one
              intelligent interface, powered by AI that understands what you are
              looking for.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: MapPin,
                title: "Unified Search",
                description:
                  "One search across all platforms. Filter by location, dates, site type, amenities, and more. See results from Recreation.gov, state parks, and provincial parks side by side.",
              },
              {
                icon: Bot,
                title: "AI Assistant",
                description:
                  "Chat naturally about your camping plans. Our AI understands context, remembers your preferences, and can proactively suggest sites you will love based on your history.",
              },
              {
                icon: Trees,
                title: "Smart Monitoring",
                description:
                  "Set alerts for sold-out sites. We scan continuously and notify you the moment a cancellation opens up — or auto-book it for you before anyone else can.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-stone-200 bg-white p-8"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-stone-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-stone-900">
            Our mission
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-stone-600">
            We are building Camper because we are campers ourselves and we know
            how frustrating the current system is. Our mission is to make it
            effortless for anyone to find and book the perfect campsite,
            regardless of which platform it is listed on.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-stone-600">
            We believe that the outdoors should be accessible to everyone — and
            that starts with removing the barriers between you and your next
            adventure. Whether you are a weekend warrior, a family looking for
            your first camping trip, or a seasoned backcountry explorer, Camper
            is built for you.
          </p>
        </div>
      </section>
    </div>
  );
}
