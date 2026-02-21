import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import { eq, and } from "drizzle-orm";
import { db } from "../../db/index.js";
import { platformCredentials } from "../../db/schema/index.js";
import { env } from "../../env.js";
import type { Platform } from "@camper/shared-types";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = env.CREDENTIAL_ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY must be set and at least 32 characters",
    );
  }
  // Use first 32 bytes (256 bits) of the key
  return Buffer.from(key.slice(0, 32), "utf-8");
}

interface RawCredentials {
  username: string;
  password: string;
}

interface EncryptedPayload {
  iv: string;
  authTag: string;
  data: string;
}

function encrypt(plaintext: string): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, "utf-8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    data: encrypted,
  };
}

function decrypt(payload: EncryptedPayload): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(payload.iv, "base64");
  const authTag = Buffer.from(payload.authTag, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(payload.data, "base64", "utf-8");
  decrypted += decipher.final("utf-8");
  return decrypted;
}

export async function saveCredential(
  userId: string,
  platform: Platform,
  credentials: RawCredentials,
): Promise<{ id: string }> {
  const encrypted = encrypt(JSON.stringify(credentials));

  // Upsert: update if exists, insert if not
  const existing = await db.query.platformCredentials.findFirst({
    where: and(
      eq(platformCredentials.userId, userId),
      eq(platformCredentials.platform, platform),
    ),
  });

  if (existing) {
    const [updated] = await db
      .update(platformCredentials)
      .set({
        encryptedCredentials: encrypted,
        lastValidatedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(platformCredentials.id, existing.id))
      .returning({ id: platformCredentials.id });
    return { id: updated!.id };
  }

  const [inserted] = await db
    .insert(platformCredentials)
    .values({
      userId,
      platform,
      encryptedCredentials: encrypted,
    })
    .returning({ id: platformCredentials.id });

  return { id: inserted!.id };
}

export async function getDecryptedCredential(
  userId: string,
  platform: Platform,
): Promise<RawCredentials | null> {
  const record = await db.query.platformCredentials.findFirst({
    where: and(
      eq(platformCredentials.userId, userId),
      eq(platformCredentials.platform, platform),
    ),
  });

  if (!record) return null;

  const decrypted = decrypt(record.encryptedCredentials);
  return JSON.parse(decrypted) as RawCredentials;
}

export async function getDecryptedCredentialById(
  credentialId: string,
): Promise<{ userId: string; platform: Platform; credentials: RawCredentials } | null> {
  const record = await db.query.platformCredentials.findFirst({
    where: eq(platformCredentials.id, credentialId),
  });

  if (!record) return null;

  const decrypted = decrypt(record.encryptedCredentials);
  return {
    userId: record.userId,
    platform: record.platform as Platform,
    credentials: JSON.parse(decrypted) as RawCredentials,
  };
}

export async function markCredentialValidated(credentialId: string): Promise<void> {
  await db
    .update(platformCredentials)
    .set({
      lastValidatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(platformCredentials.id, credentialId));
}

export async function deleteCredential(
  userId: string,
  platform: Platform,
): Promise<boolean> {
  const result = await db
    .delete(platformCredentials)
    .where(
      and(
        eq(platformCredentials.userId, userId),
        eq(platformCredentials.platform, platform),
      ),
    )
    .returning({ id: platformCredentials.id });

  return result.length > 0;
}

export async function listCredentials(userId: string) {
  const records = await db.query.platformCredentials.findMany({
    where: eq(platformCredentials.userId, userId),
    columns: {
      id: true,
      platform: true,
      lastValidatedAt: true,
      createdAt: true,
    },
  });

  return records;
}

export async function getCredentialById(credentialId: string, userId: string) {
  return db.query.platformCredentials.findFirst({
    where: and(
      eq(platformCredentials.id, credentialId),
      eq(platformCredentials.userId, userId),
    ),
    columns: {
      id: true,
      platform: true,
      lastValidatedAt: true,
      createdAt: true,
    },
  });
}
