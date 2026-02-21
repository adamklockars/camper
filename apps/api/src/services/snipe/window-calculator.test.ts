import { describe, it, expect } from "vitest";
import {
  calculateWindowOpensAt,
  calculatePreStageAt,
  supportsSnipeBooking,
} from "./window-calculator.js";

describe("window-calculator", () => {
  describe("calculateWindowOpensAt", () => {
    describe("Ontario Parks", () => {
      it("calculates 5 months before arrival at 7:00 AM EST (12:00 UTC)", () => {
        // Aug 15 arrival → Mar 15 at 7:00 AM EST = 12:00 UTC
        const result = calculateWindowOpensAt("ontario_parks", "2026-08-15");
        expect(result.toISOString()).toBe("2026-03-15T12:00:00.000Z");
      });

      it("handles month rollback across year boundary", () => {
        // Feb 10 arrival → Sep 10 of previous year at 12:00 UTC
        const result = calculateWindowOpensAt("ontario_parks", "2026-02-10");
        expect(result.toISOString()).toBe("2025-09-10T12:00:00.000Z");
      });

      it("clamps day when target month is shorter", () => {
        // Oct 31 arrival → May 31 (May has 31 days, so no clamping needed)
        const result = calculateWindowOpensAt("ontario_parks", "2026-10-31");
        expect(result.toISOString()).toBe("2026-05-31T12:00:00.000Z");
      });

      it("clamps day for months with fewer days", () => {
        // Aug 31 arrival → Mar 31 at 12:00 UTC
        const result = calculateWindowOpensAt("ontario_parks", "2026-08-31");
        expect(result.toISOString()).toBe("2026-03-31T12:00:00.000Z");
      });

      it("handles Jul 29 exception (opens Mar 1)", () => {
        const result = calculateWindowOpensAt("ontario_parks", "2026-07-29");
        expect(result.toISOString()).toBe("2026-03-01T12:00:00.000Z");
      });

      it("handles Jul 30 exception (opens Mar 1)", () => {
        const result = calculateWindowOpensAt("ontario_parks", "2026-07-30");
        expect(result.toISOString()).toBe("2026-03-01T12:00:00.000Z");
      });

      it("handles Jul 31 exception (opens Mar 1)", () => {
        const result = calculateWindowOpensAt("ontario_parks", "2026-07-31");
        expect(result.toISOString()).toBe("2026-03-01T12:00:00.000Z");
      });

      it("Jul 28 follows standard rule (not exception)", () => {
        // Jul 28 → Feb 28 at 12:00 UTC (standard 5-month rule)
        const result = calculateWindowOpensAt("ontario_parks", "2026-07-28");
        expect(result.toISOString()).toBe("2026-02-28T12:00:00.000Z");
      });

      it("handles leap year (Jul 28 → Feb 28 in non-leap year)", () => {
        const result = calculateWindowOpensAt("ontario_parks", "2027-07-28");
        expect(result.toISOString()).toBe("2027-02-28T12:00:00.000Z");
      });

      it("handles leap year correctly (Jul 28 → Feb 28 in leap year)", () => {
        const result = calculateWindowOpensAt("ontario_parks", "2028-07-28");
        expect(result.toISOString()).toBe("2028-02-28T12:00:00.000Z");
      });
    });

    describe("Recreation.gov", () => {
      it("calculates 6 months before arrival at midnight EST (05:00 UTC)", () => {
        // Aug 15 arrival → Feb 15 at midnight EST = 05:00 UTC
        const result = calculateWindowOpensAt("recreation_gov", "2026-08-15");
        expect(result.toISOString()).toBe("2026-02-15T05:00:00.000Z");
      });
    });

    describe("Parks Canada", () => {
      it("calculates 5 months before arrival at 8:00 AM EST (13:00 UTC)", () => {
        // Aug 15 arrival → Mar 15 at 8:00 AM EST = 13:00 UTC
        const result = calculateWindowOpensAt("parks_canada", "2026-08-15");
        expect(result.toISOString()).toBe("2026-03-15T13:00:00.000Z");
      });
    });

    describe("unsupported platforms", () => {
      it("throws for unsupported platform", () => {
        expect(() => calculateWindowOpensAt("hipcamp", "2026-08-15")).toThrow(
          "not supported",
        );
      });
    });
  });

  describe("calculatePreStageAt", () => {
    it("returns 3 minutes before window opens", () => {
      const windowOpens = new Date("2026-03-15T12:00:00.000Z");
      const preStage = calculatePreStageAt(windowOpens);
      expect(preStage.toISOString()).toBe("2026-03-15T11:57:00.000Z");
    });
  });

  describe("supportsSnipeBooking", () => {
    it("returns true for ontario_parks", () => {
      expect(supportsSnipeBooking("ontario_parks")).toBe(true);
    });

    it("returns true for recreation_gov", () => {
      expect(supportsSnipeBooking("recreation_gov")).toBe(true);
    });

    it("returns true for parks_canada", () => {
      expect(supportsSnipeBooking("parks_canada")).toBe(true);
    });

    it("returns false for hipcamp", () => {
      expect(supportsSnipeBooking("hipcamp")).toBe(false);
    });

    it("returns false for tentrr", () => {
      expect(supportsSnipeBooking("tentrr")).toBe(false);
    });
  });
});
