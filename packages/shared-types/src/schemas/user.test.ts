import { describe, it, expect } from "vitest";
import {
  subscriptionTierSchema,
  userSchema,
  userPreferencesSchema,
  updatePreferencesSchema,
} from "./user";

describe("subscriptionTierSchema", () => {
  it("accepts free and premium", () => {
    expect(subscriptionTierSchema.parse("free")).toBe("free");
    expect(subscriptionTierSchema.parse("premium")).toBe("premium");
  });

  it("rejects invalid tier", () => {
    expect(() => subscriptionTierSchema.parse("enterprise")).toThrow();
  });
});

describe("userSchema", () => {
  const validUser = {
    id: "u-1",
    email: "test@example.com",
    name: "Test User",
    image: null,
    stripeCustomerId: null,
    subscriptionTier: "free",
    onboardingCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("accepts a valid user", () => {
    expect(userSchema.parse(validUser)).toEqual(validUser);
  });

  it("rejects invalid email", () => {
    expect(() => userSchema.parse({ ...validUser, email: "not-an-email" })).toThrow();
  });
});

describe("userPreferencesSchema", () => {
  it("allows nullable groupSize, budgetMin, budgetMax", () => {
    const prefs = {
      id: "p-1",
      userId: "u-1",
      preferredRegions: [],
      groupSize: null,
      siteTypes: [],
      amenityPreferences: [],
      budgetMin: null,
      budgetMax: null,
      currency: "USD",
      petsAllowed: false,
      accessibilityNeeds: [],
    };
    expect(userPreferencesSchema.parse(prefs)).toEqual(prefs);
  });
});

describe("updatePreferencesSchema", () => {
  it("accepts all fields as optional", () => {
    expect(updatePreferencesSchema.parse({})).toEqual({});
  });

  it("accepts partial updates", () => {
    const result = updatePreferencesSchema.parse({ petsAllowed: true, groupSize: 4 });
    expect(result.petsAllowed).toBe(true);
    expect(result.groupSize).toBe(4);
  });
});
