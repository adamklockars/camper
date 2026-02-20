import Link from "next/link";
import { Check, X, ArrowRight } from "lucide-react";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for occasional campers who want basic search and alerts.",
    cta: "Get Started Free",
    href: "/auth/signup",
    highlighted: false,
    features: [
      { text: "Up to 3 active alerts", included: true },
      { text: "Email notifications", included: true },
      { text: "Basic campsite search", included: true },
      { text: "AI chat assistant", included: true },
      { text: "US & Canada coverage", included: true },
      { text: "SMS notifications", included: false },
      { text: "Faster scan intervals", included: false },
      { text: "Auto-book on cancellation", included: false },
      { text: "Unlimited alerts", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Premium",
    price: "$9.99",
    period: "/mo",
    description: "For serious campers who want every advantage in securing top sites.",
    cta: "Start Premium Trial",
    href: "/auth/signup?plan=premium",
    highlighted: true,
    features: [
      { text: "Unlimited active alerts", included: true },
      { text: "Email notifications", included: true },
      { text: "Advanced campsite search", included: true },
      { text: "AI chat assistant", included: true },
      { text: "US & Canada coverage", included: true },
      { text: "SMS notifications", included: true },
      { text: "Faster scan intervals (1 min)", included: true },
      { text: "Auto-book on cancellation", included: true },
      { text: "Unlimited alerts", included: true },
      { text: "Priority support", included: true },
    ],
  },
];

const faqs = [
  {
    question: "What happens when an alert triggers?",
    answer:
      "When a campsite matching your alert criteria becomes available, you'll receive an instant notification via email (and SMS on Premium). If you have auto-book enabled on Premium, we can attempt to reserve the site for you automatically.",
  },
  {
    question: "Which platforms do you support?",
    answer:
      "We aggregate data from Recreation.gov, Reserve California, Reserve America, BC Parks, Parks Canada, Ontario Parks, and many other state and provincial booking platforms across the US and Canada.",
  },
  {
    question: "Can I cancel my Premium subscription anytime?",
    answer:
      "Yes, you can cancel your Premium subscription at any time. You'll continue to have Premium access until the end of your current billing period.",
  },
  {
    question: "How fast are the scan intervals?",
    answer:
      "Free accounts check for availability every 15 minutes. Premium accounts scan every 1 minute, giving you a significant advantage when popular sites open up from cancellations.",
  },
  {
    question: "What does auto-book mean?",
    answer:
      "With auto-book enabled (Premium only), when we detect an opening matching your alert, we'll automatically attempt to reserve the campsite on your behalf. You'll need to have your booking credentials saved for the relevant platform.",
  },
  {
    question: "Is my payment information secure?",
    answer:
      "Yes, all payment processing is handled by Stripe. We never store your credit card information on our servers.",
  },
];

export default function PricingPage() {
  return (
    <div className="bg-white">
      {/* ── Header ── */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-stone-600">
            Start for free and upgrade when you need more power. No hidden fees,
            cancel anytime.
          </p>
        </div>
      </section>

      {/* ── Pricing Cards ── */}
      <section className="-mt-4 pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border p-8 ${
                  tier.highlighted
                    ? "border-primary-300 bg-white shadow-xl shadow-primary-100/50 ring-1 ring-primary-200"
                    : "border-stone-200 bg-white"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full bg-primary-600 px-4 py-1 text-xs font-semibold text-white">
                      Most Popular
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-stone-900">
                    {tier.name}
                  </h3>
                  <p className="mt-1 text-sm text-stone-500">
                    {tier.description}
                  </p>
                </div>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-stone-900">
                    {tier.price}
                  </span>
                  <span className="text-sm text-stone-500">{tier.period}</span>
                </div>

                <Link
                  href={tier.href}
                  className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors ${
                    tier.highlighted
                      ? "bg-primary-600 text-white shadow-sm hover:bg-primary-700"
                      : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {tier.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <ul className="mt-8 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature.text} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                      ) : (
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-stone-300" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included ? "text-stone-700" : "text-stone-400"
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Comparison Table ── */}
      <section className="border-t border-stone-200 bg-stone-50 py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-extrabold text-stone-900">
            Feature comparison
          </h2>

          <div className="mt-12 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-300">
                  <th className="pb-4 pr-6 font-semibold text-stone-900">
                    Feature
                  </th>
                  <th className="pb-4 pr-6 text-center font-semibold text-stone-900">
                    Free
                  </th>
                  <th className="pb-4 text-center font-semibold text-primary-600">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {[
                  ["Active alerts", "3", "Unlimited"],
                  ["Scan interval", "15 min", "1 min"],
                  ["Email notifications", true, true],
                  ["SMS notifications", false, true],
                  ["AI chat assistant", true, true],
                  ["Cross-border search", true, true],
                  ["Auto-book", false, true],
                  ["Priority support", false, true],
                ].map(([feature, free, premium]) => (
                  <tr key={feature as string}>
                    <td className="py-3 pr-6 text-stone-700">
                      {feature as string}
                    </td>
                    <td className="py-3 pr-6 text-center">
                      {typeof free === "boolean" ? (
                        free ? (
                          <Check className="mx-auto h-4 w-4 text-primary-600" />
                        ) : (
                          <X className="mx-auto h-4 w-4 text-stone-300" />
                        )
                      ) : (
                        <span className="text-stone-600">{free}</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {typeof premium === "boolean" ? (
                        premium ? (
                          <Check className="mx-auto h-4 w-4 text-primary-600" />
                        ) : (
                          <X className="mx-auto h-4 w-4 text-stone-300" />
                        )
                      ) : (
                        <span className="font-medium text-stone-900">
                          {premium}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-extrabold text-stone-900">
            Frequently asked questions
          </h2>

          <div className="mt-12 space-y-8">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="text-base font-semibold text-stone-900">
                  {faq.question}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
