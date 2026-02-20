vi.mock("../../env.js", () => ({
  env: {
    DATABASE_URL: "postgres://test:test@localhost:5432/test",
    REDIS_URL: "redis://localhost:6379",
    ANTHROPIC_API_KEY: "",
    STRIPE_SECRET_KEY: "",
    RESEND_API_KEY: "",
    BETTER_AUTH_SECRET: "test-secret",
    BETTER_AUTH_URL: "http://localhost:4000",
    CORS_ORIGIN: "http://localhost:3000",
    PORT: 4000,
  },
}));
