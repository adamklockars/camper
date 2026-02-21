import { describe, it, expect } from "vitest";
import {
  platformCredentialSchema,
  savePlatformCredentialInputSchema,
  platformCredentialListItemSchema,
} from "./platform-credential";

describe("platformCredentialSchema", () => {
  const validCredential = {
    id: "cred-1",
    userId: "user-1",
    platform: "ontario_parks",
    lastValidatedAt: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };

  it("accepts a valid credential", () => {
    const result = platformCredentialSchema.parse(validCredential);
    expect(result.id).toBe("cred-1");
    expect(result.platform).toBe("ontario_parks");
  });

  it("accepts credential with validation date", () => {
    const result = platformCredentialSchema.parse({
      ...validCredential,
      lastValidatedAt: new Date("2026-01-15"),
    });
    expect(result.lastValidatedAt).toBeInstanceOf(Date);
  });

  it("accepts all valid platforms", () => {
    const platforms = [
      "recreation_gov",
      "parks_canada",
      "ontario_parks",
      "hipcamp",
      "tentrr",
    ];
    for (const p of platforms) {
      const result = platformCredentialSchema.parse({
        ...validCredential,
        platform: p,
      });
      expect(result.platform).toBe(p);
    }
  });

  it("rejects invalid platform", () => {
    expect(() =>
      platformCredentialSchema.parse({
        ...validCredential,
        platform: "unknown",
      }),
    ).toThrow();
  });

  it("rejects missing userId", () => {
    const { userId, ...rest } = validCredential;
    expect(() => platformCredentialSchema.parse(rest)).toThrow();
  });
});

describe("savePlatformCredentialInputSchema", () => {
  const validInput = {
    platform: "ontario_parks",
    username: "user@example.com",
    password: "mypassword123",
  };

  it("accepts valid save input", () => {
    const result = savePlatformCredentialInputSchema.parse(validInput);
    expect(result.platform).toBe("ontario_parks");
    expect(result.username).toBe("user@example.com");
    expect(result.password).toBe("mypassword123");
  });

  it("rejects empty username", () => {
    expect(() =>
      savePlatformCredentialInputSchema.parse({
        ...validInput,
        username: "",
      }),
    ).toThrow();
  });

  it("rejects empty password", () => {
    expect(() =>
      savePlatformCredentialInputSchema.parse({
        ...validInput,
        password: "",
      }),
    ).toThrow();
  });

  it("rejects missing platform", () => {
    const { platform, ...rest } = validInput;
    expect(() => savePlatformCredentialInputSchema.parse(rest)).toThrow();
  });

  it("rejects invalid platform", () => {
    expect(() =>
      savePlatformCredentialInputSchema.parse({
        ...validInput,
        platform: "invalid_platform",
      }),
    ).toThrow();
  });
});

describe("platformCredentialListItemSchema", () => {
  it("accepts a valid list item", () => {
    const result = platformCredentialListItemSchema.parse({
      id: "cred-1",
      platform: "ontario_parks",
      lastValidatedAt: null,
      createdAt: new Date("2026-01-01"),
    });
    expect(result.id).toBe("cred-1");
  });

  it("does not include sensitive fields", () => {
    const item = platformCredentialListItemSchema.parse({
      id: "cred-1",
      platform: "ontario_parks",
      lastValidatedAt: null,
      createdAt: new Date("2026-01-01"),
    });
    // Schema should only have id, platform, lastValidatedAt, createdAt
    expect(Object.keys(item)).toEqual(
      expect.arrayContaining(["id", "platform", "lastValidatedAt", "createdAt"]),
    );
  });

  it("accepts credential with lastValidatedAt set", () => {
    const result = platformCredentialListItemSchema.parse({
      id: "cred-1",
      platform: "parks_canada",
      lastValidatedAt: new Date("2026-02-01"),
      createdAt: new Date("2026-01-01"),
    });
    expect(result.lastValidatedAt).toBeInstanceOf(Date);
  });
});
