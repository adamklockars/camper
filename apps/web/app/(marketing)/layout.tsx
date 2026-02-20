import Link from "next/link";
import { Trees } from "lucide-react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Navigation ── */}
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Trees className="h-7 w-7 text-primary-600" />
            <span className="text-xl font-bold text-stone-900">Camper</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/pricing"
              className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
            >
              About
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="text-sm font-medium text-stone-700 transition-colors hover:text-stone-900"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Page Content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="border-t border-stone-200 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2">
                <Trees className="h-6 w-6 text-primary-600" />
                <span className="text-lg font-bold text-stone-900">Camper</span>
              </Link>
              <p className="mt-3 text-sm text-stone-500">
                Your AI-powered camping assistant for finding and booking the
                perfect campsite.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-stone-900">Product</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/pricing" className="text-sm text-stone-500 hover:text-stone-700">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-sm text-stone-500 hover:text-stone-700">
                    About
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-sm font-semibold text-stone-900">Support</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="#" className="text-sm text-stone-500 hover:text-stone-700">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-stone-500 hover:text-stone-700">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-stone-900">Legal</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="#" className="text-sm text-stone-500 hover:text-stone-700">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-stone-500 hover:text-stone-700">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-stone-200 pt-6">
            <p className="text-center text-sm text-stone-400">
              &copy; {new Date().getFullYear()} Camper. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
