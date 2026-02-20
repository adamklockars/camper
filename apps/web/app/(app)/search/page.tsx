"use client";

import { useState } from "react";
import {
  Search,
  MapPin,
  Calendar,
  Users,
  SlidersHorizontal,
  Tent,
  Caravan,
  Home,
  Mountain,
  Eye,
  ShoppingCart,
  Star,
  Wifi,
  Flame,
  Droplets,
  Car,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SiteType = "tent" | "rv" | "cabin" | "backcountry";

const siteTypes: { value: SiteType; label: string; icon: typeof Tent }[] = [
  { value: "tent", label: "Tent", icon: Tent },
  { value: "rv", label: "RV", icon: Caravan },
  { value: "cabin", label: "Cabin", icon: Home },
  { value: "backcountry", label: "Backcountry", icon: Mountain },
];

const amenities = [
  { value: "wifi", label: "Wi-Fi", icon: Wifi },
  { value: "firepit", label: "Fire Pit", icon: Flame },
  { value: "water", label: "Water", icon: Droplets },
  { value: "parking", label: "Parking", icon: Car },
];

interface MockCampsite {
  id: string;
  name: string;
  campground: string;
  siteType: SiteType;
  price: number;
  rating: number;
  available: boolean;
  imageUrl: string;
}

const mockResults: MockCampsite[] = [
  {
    id: "1",
    name: "Site 42 — Riverside",
    campground: "Yosemite Upper Pines",
    siteType: "tent",
    price: 35,
    rating: 4.8,
    available: true,
    imageUrl: "",
  },
  {
    id: "2",
    name: "Site 15 — Lakeview",
    campground: "Lake Tahoe Basin",
    siteType: "tent",
    price: 40,
    rating: 4.6,
    available: true,
    imageUrl: "",
  },
  {
    id: "3",
    name: "Lot A-7 — Full Hookup",
    campground: "Joshua Tree Black Rock",
    siteType: "rv",
    price: 55,
    rating: 4.4,
    available: false,
    imageUrl: "",
  },
  {
    id: "4",
    name: "Pine Cabin 3",
    campground: "Sequoia National Forest",
    siteType: "cabin",
    price: 120,
    rating: 4.9,
    available: true,
    imageUrl: "",
  },
  {
    id: "5",
    name: "Backcountry Zone C",
    campground: "Olympic National Park",
    siteType: "backcountry",
    price: 15,
    rating: 4.7,
    available: true,
    imageUrl: "",
  },
  {
    id: "6",
    name: "Site 8 — Meadow",
    campground: "Glacier National Park",
    siteType: "tent",
    price: 30,
    rating: 4.5,
    available: false,
    imageUrl: "",
  },
];

const siteTypeIcon: Record<SiteType, typeof Tent> = {
  tent: Tent,
  rv: Caravan,
  cabin: Home,
  backcountry: Mountain,
};

export default function SearchPage() {
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [groupSize, setGroupSize] = useState("2");
  const [selectedTypes, setSelectedTypes] = useState<SiteType[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const toggleSiteType = (type: SiteType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleSearch = () => {
    // Placeholder: In production this would call trpc.campsite.search.query()
    setHasSearched(true);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Search Bar ── */}
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Location */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where do you want to camp?"
                className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>

            {/* Check In */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm text-stone-900 focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>

            {/* Check Out */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm text-stone-900 focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>

          {/* Filter Toggle */}
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                showFilters
                  ? "border-primary-200 bg-primary-50 text-primary-700"
                  : "border-stone-200 text-stone-600 hover:bg-stone-50"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </button>

            {/* Group Size */}
            <div className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-1.5">
              <Users className="h-3.5 w-3.5 text-stone-400" />
              <select
                value={groupSize}
                onChange={(e) => setGroupSize(e.target.value)}
                className="bg-transparent text-xs font-medium text-stone-600 focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "person" : "people"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Expanded Filters ── */}
          {showFilters && (
            <div className="mt-4 border-t border-stone-200 pt-4">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Site Types */}
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Site Type
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {siteTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => toggleSiteType(type.value)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                          selectedTypes.includes(type.value)
                            ? "border-primary-300 bg-primary-50 text-primary-700"
                            : "border-stone-200 text-stone-600 hover:bg-stone-50"
                        )}
                      >
                        <type.icon className="h-3.5 w-3.5" />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Amenities
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((amenity) => (
                      <button
                        key={amenity.value}
                        onClick={() => toggleAmenity(amenity.value)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                          selectedAmenities.includes(amenity.value)
                            ? "border-primary-300 bg-primary-50 text-primary-700"
                            : "border-stone-200 text-stone-600 hover:bg-stone-50"
                        )}
                      >
                        <amenity.icon className="h-3.5 w-3.5" />
                        {amenity.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Results ── */}
        {hasSearched && (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-stone-600">
                <span className="font-semibold text-stone-900">
                  {mockResults.length}
                </span>{" "}
                campsites found
              </p>
              <select className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 focus:outline-none">
                <option>Sort by relevance</option>
                <option>Price: low to high</option>
                <option>Price: high to low</option>
                <option>Rating</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mockResults.map((campsite) => {
                const Icon = siteTypeIcon[campsite.siteType];
                return (
                  <div
                    key={campsite.id}
                    className="group overflow-hidden rounded-2xl border border-stone-200 bg-white transition-all hover:shadow-lg"
                  >
                    {/* Image placeholder */}
                    <div className="relative h-40 bg-gradient-to-br from-primary-100 to-primary-50">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className="h-12 w-12 text-primary-300" />
                      </div>
                      {/* Availability badge */}
                      <div className="absolute right-3 top-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                            campsite.available
                              ? "bg-primary-100 text-primary-700"
                              : "bg-stone-100 text-stone-500"
                          )}
                        >
                          {campsite.available ? "Available" : "Sold Out"}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-stone-900">
                            {campsite.name}
                          </h3>
                          <p className="mt-0.5 text-sm text-stone-500">
                            {campsite.campground}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-accent-600">
                          <Star className="h-3.5 w-3.5 fill-accent-500" />
                          <span className="text-xs font-semibold">
                            {campsite.rating}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">
                          <Icon className="h-3 w-3" />
                          {campsite.siteType.charAt(0).toUpperCase() +
                            campsite.siteType.slice(1)}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-lg font-bold text-stone-900">
                          ${campsite.price}
                          <span className="text-sm font-normal text-stone-500">
                            /night
                          </span>
                        </p>

                        <div className="flex gap-2">
                          {campsite.available ? (
                            <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700">
                              <ShoppingCart className="h-3 w-3" />
                              Book
                            </button>
                          ) : (
                            <button className="inline-flex items-center gap-1.5 rounded-lg border border-accent-300 bg-accent-50 px-3 py-1.5 text-xs font-semibold text-accent-700 transition-colors hover:bg-accent-100">
                              <Eye className="h-3 w-3" />
                              Watch
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Empty State ── */}
        {!hasSearched && (
          <div className="mt-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100">
              <Search className="h-8 w-8 text-stone-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-stone-900">
              Search for campsites
            </h3>
            <p className="mt-1 text-sm text-stone-500">
              Enter a location and dates to find available campsites across US
              and Canada.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
