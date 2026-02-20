import "dotenv/config";

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  REDIS_URL: required("REDIS_URL"),
  ANTHROPIC_API_KEY: optional("ANTHROPIC_API_KEY", ""),
  STRIPE_SECRET_KEY: optional("STRIPE_SECRET_KEY", ""),
  RESEND_API_KEY: optional("RESEND_API_KEY", ""),
  BETTER_AUTH_SECRET: required("BETTER_AUTH_SECRET"),
  BETTER_AUTH_URL: required("BETTER_AUTH_URL"),
  CORS_ORIGIN: optional("CORS_ORIGIN", "http://localhost:3000"),
  PORT: parseInt(optional("PORT", "4000"), 10),
} as const;

export type Env = typeof env;
