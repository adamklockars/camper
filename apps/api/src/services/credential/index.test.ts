import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  TEST_USER_ID,
  TEST_CREDENTIAL_ID,
} from "../../test/fixtures.js";

const { mockDb } = vi.hoisted(() => {
  const CREDENTIAL_ID = "00000000-0000-0000-0000-000000000009";
  const returningFn = vi.fn().mockResolvedValue([{ id: CREDENTIAL_ID }]);
  const whereFn = vi.fn().mockReturnValue({ returning: returningFn });
  const setFn = vi.fn().mockReturnValue({ where: whereFn, returning: returningFn });
  const valuesFn = vi.fn().mockReturnValue({ returning: returningFn });
  const deleteWhereFn = vi.fn().mockReturnValue({ returning: returningFn });

  return {
    mockDb: {
      query: {
        platformCredentials: {
          findFirst: vi.fn(),
          findMany: vi.fn().mockResolvedValue([]),
        },
      },
      insert: vi.fn().mockReturnValue({ values: valuesFn }),
      update: vi.fn().mockReturnValue({ set: setFn }),
      delete: vi.fn().mockReturnValue({ where: deleteWhereFn }),
      _returning: returningFn,
      _where: whereFn,
      _set: setFn,
      _values: valuesFn,
      _deleteWhere: deleteWhereFn,
    },
  };
});

vi.mock("../../db/index.js", () => ({ db: mockDb }));
vi.mock("../../db/schema/index.js", () => ({
  platformCredentials: {
    id: "id",
    userId: "user_id",
    platform: "platform",
    encryptedCredentials: "encrypted_credentials",
    lastValidatedAt: "last_validated_at",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
}));
vi.mock("../../env.js", () => ({
  env: {
    CREDENTIAL_ENCRYPTION_KEY: "test-encryption-key-32-chars-ok!",
  },
}));

import {
  saveCredential,
  getDecryptedCredential,
  getDecryptedCredentialById,
  markCredentialValidated,
  deleteCredential,
  listCredentials,
  getCredentialById,
} from "./index.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("saveCredential", () => {
  it("inserts a new credential when none exists", async () => {
    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce(null);

    const result = await saveCredential(TEST_USER_ID, "ontario_parks", {
      username: "user@test.com",
      password: "pass123",
    });

    expect(result.id).toBe(TEST_CREDENTIAL_ID);
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("updates existing credential (upsert)", async () => {
    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce({
      id: TEST_CREDENTIAL_ID,
      userId: TEST_USER_ID,
      platform: "ontario_parks",
    });

    const result = await saveCredential(TEST_USER_ID, "ontario_parks", {
      username: "user@test.com",
      password: "newpass456",
    });

    expect(result.id).toBe(TEST_CREDENTIAL_ID);
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("encrypts credentials before storing", async () => {
    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce(null);

    await saveCredential(TEST_USER_ID, "ontario_parks", {
      username: "user@test.com",
      password: "secret!",
    });

    // The values function should have been called with encrypted data
    const valuesCall = mockDb._values.mock.calls[0]?.[0];
    expect(valuesCall).toBeDefined();
    expect(valuesCall.encryptedCredentials).toBeDefined();
    expect(valuesCall.encryptedCredentials.iv).toBeDefined();
    expect(valuesCall.encryptedCredentials.authTag).toBeDefined();
    expect(valuesCall.encryptedCredentials.data).toBeDefined();
    // Should NOT contain plaintext
    expect(JSON.stringify(valuesCall.encryptedCredentials)).not.toContain("secret!");
  });

  it("generates unique IVs for different encryptions", async () => {
    mockDb.query.platformCredentials.findFirst.mockResolvedValue(null);

    await saveCredential(TEST_USER_ID, "ontario_parks", {
      username: "user1@test.com",
      password: "pass1",
    });

    const iv1 = mockDb._values.mock.calls[0]?.[0]?.encryptedCredentials?.iv;

    await saveCredential(TEST_USER_ID, "parks_canada", {
      username: "user2@test.com",
      password: "pass2",
    });

    const iv2 = mockDb._values.mock.calls[1]?.[0]?.encryptedCredentials?.iv;

    expect(iv1).toBeDefined();
    expect(iv2).toBeDefined();
    expect(iv1).not.toBe(iv2);
  });
});

describe("getDecryptedCredential", () => {
  it("returns null when credential not found", async () => {
    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce(null);

    const result = await getDecryptedCredential(TEST_USER_ID, "ontario_parks");

    expect(result).toBeNull();
  });

  it("decrypts and returns credentials", async () => {
    // First save a credential to get real encrypted data
    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce(null);
    await saveCredential(TEST_USER_ID, "ontario_parks", {
      username: "user@test.com",
      password: "mypass123",
    });

    // Get the encrypted data that was stored
    const encryptedData = mockDb._values.mock.calls[0]?.[0]?.encryptedCredentials;

    // Now mock findFirst to return that encrypted data
    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce({
      id: TEST_CREDENTIAL_ID,
      userId: TEST_USER_ID,
      platform: "ontario_parks",
      encryptedCredentials: encryptedData,
    });

    const result = await getDecryptedCredential(TEST_USER_ID, "ontario_parks");

    expect(result).toEqual({
      username: "user@test.com",
      password: "mypass123",
    });
  });
});

describe("getDecryptedCredentialById", () => {
  it("returns null when credential not found", async () => {
    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce(null);

    const result = await getDecryptedCredentialById("nonexistent");

    expect(result).toBeNull();
  });

  it("returns userId, platform, and decrypted credentials", async () => {
    // First save to get real encrypted data
    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce(null);
    await saveCredential(TEST_USER_ID, "ontario_parks", {
      username: "admin@park.ca",
      password: "parkpass",
    });

    const encryptedData = mockDb._values.mock.calls[0]?.[0]?.encryptedCredentials;

    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce({
      id: TEST_CREDENTIAL_ID,
      userId: TEST_USER_ID,
      platform: "ontario_parks",
      encryptedCredentials: encryptedData,
    });

    const result = await getDecryptedCredentialById(TEST_CREDENTIAL_ID);

    expect(result).not.toBeNull();
    expect(result!.userId).toBe(TEST_USER_ID);
    expect(result!.platform).toBe("ontario_parks");
    expect(result!.credentials).toEqual({
      username: "admin@park.ca",
      password: "parkpass",
    });
  });
});

describe("markCredentialValidated", () => {
  it("updates lastValidatedAt and updatedAt", async () => {
    await markCredentialValidated(TEST_CREDENTIAL_ID);

    expect(mockDb.update).toHaveBeenCalled();
    const setCall = mockDb._set.mock.calls[0]?.[0];
    expect(setCall).toBeDefined();
    expect(setCall.lastValidatedAt).toBeInstanceOf(Date);
    expect(setCall.updatedAt).toBeInstanceOf(Date);
  });
});

describe("deleteCredential", () => {
  it("returns true when credential is deleted", async () => {
    mockDb._returning.mockResolvedValueOnce([{ id: TEST_CREDENTIAL_ID }]);

    const result = await deleteCredential(TEST_USER_ID, "ontario_parks");

    expect(result).toBe(true);
    expect(mockDb.delete).toHaveBeenCalled();
  });

  it("returns false when credential not found", async () => {
    mockDb._returning.mockResolvedValueOnce([]);

    const result = await deleteCredential(TEST_USER_ID, "hipcamp");

    expect(result).toBe(false);
  });
});

describe("listCredentials", () => {
  it("returns credentials without encrypted data", async () => {
    mockDb.query.platformCredentials.findMany.mockResolvedValueOnce([
      {
        id: "cred-1",
        platform: "ontario_parks",
        lastValidatedAt: null,
        createdAt: new Date(),
      },
      {
        id: "cred-2",
        platform: "parks_canada",
        lastValidatedAt: new Date("2026-01-15"),
        createdAt: new Date(),
      },
    ]);

    const result = await listCredentials(TEST_USER_ID);

    expect(result).toHaveLength(2);
    expect(result[0]).not.toHaveProperty("encryptedCredentials");
    expect(result[1]!.lastValidatedAt).toBeInstanceOf(Date);
  });

  it("returns empty array when no credentials", async () => {
    mockDb.query.platformCredentials.findMany.mockResolvedValueOnce([]);

    const result = await listCredentials(TEST_USER_ID);

    expect(result).toEqual([]);
  });
});

describe("getCredentialById", () => {
  it("returns credential metadata", async () => {
    // Drizzle's columns filter returns only selected fields
    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce({
      id: TEST_CREDENTIAL_ID,
      platform: "ontario_parks",
      lastValidatedAt: null,
      createdAt: new Date("2026-01-01"),
    });

    const result = await getCredentialById(TEST_CREDENTIAL_ID, TEST_USER_ID);

    expect(result).toBeDefined();
    expect(result!.id).toBe(TEST_CREDENTIAL_ID);
    expect(result!.platform).toBe("ontario_parks");
  });

  it("returns undefined when not found", async () => {
    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce(undefined);

    const result = await getCredentialById("nonexistent", TEST_USER_ID);

    expect(result).toBeUndefined();
  });
});

describe("encryption round-trip", () => {
  it("encrypts and decrypts credentials correctly", async () => {
    // Use the actual encrypt/decrypt via save + get cycle
    const credentials = { username: "test@email.com", password: "P@ssw0rd!#$%^&*()" };

    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce(null);
    await saveCredential(TEST_USER_ID, "ontario_parks", credentials);

    const encryptedData = mockDb._values.mock.calls[0]?.[0]?.encryptedCredentials;

    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce({
      id: TEST_CREDENTIAL_ID,
      userId: TEST_USER_ID,
      platform: "ontario_parks",
      encryptedCredentials: encryptedData,
    });

    const decrypted = await getDecryptedCredential(TEST_USER_ID, "ontario_parks");

    expect(decrypted).toEqual(credentials);
  });

  it("handles special characters in credentials", async () => {
    const credentials = {
      username: "user+special@test.ca",
      password: "p@$$wörd with spàces & 日本語",
    };

    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce(null);
    await saveCredential(TEST_USER_ID, "parks_canada", credentials);

    const encryptedData = mockDb._values.mock.calls[0]?.[0]?.encryptedCredentials;

    mockDb.query.platformCredentials.findFirst.mockResolvedValueOnce({
      id: "cred-special",
      userId: TEST_USER_ID,
      platform: "parks_canada",
      encryptedCredentials: encryptedData,
    });

    const decrypted = await getDecryptedCredential(TEST_USER_ID, "parks_canada");

    expect(decrypted).toEqual(credentials);
  });
});
