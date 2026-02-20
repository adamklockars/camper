# CLAUDE.md

## Monorepo Structure

- `apps/api` — Fastify + tRPC API server and BullMQ workers
- `apps/web` — Next.js 15 web application (Tailwind CSS v4)
- `apps/mobile` — Expo React Native mobile app
- `packages/shared-types` — Zod schemas and inferred TypeScript types
- `packages/api-client` — tRPC client utilities (re-exports)
- `packages/ui` — Shared UI components and brand theme

## Key Commands

```bash
pnpm dev                          # All dev servers
pnpm --filter @camper/api dev     # API only
pnpm --filter @camper/web dev     # Web only
pnpm test                         # All tests
pnpm --filter @camper/api test    # API tests
pnpm typecheck                    # Type-check all packages (6 packages)
pnpm build                        # Build all packages
pnpm db:generate                  # Generate Drizzle migrations
pnpm db:migrate                   # Run migrations
pnpm db:push                      # Push schema directly
docker compose up -d              # Start PostgreSQL + Redis
```

## Architecture Decisions

- **ESM-only**: All packages use `"type": "module"` with `.js` extensions in imports
- **tRPC v11** with superjson transformer for end-to-end type-safe API
- **Drizzle ORM** with Neon serverless PostgreSQL driver
- **Services layer**: tRPC routers → service modules → database/external APIs
- **Platform adapters**: `BasePlatformAdapter` interface for each campsite platform (Recreation.gov, Hipcamp, Parks Canada)
- **BullMQ workers**: Background jobs for availability scanning and alert expiration
- **Zod-first schemas**: All types defined as Zod schemas in `@camper/shared-types`, TypeScript types inferred via `z.infer<>`
- **Each app creates its own tRPC client**: Don't share `AppRouter` type through api-client; import it directly from `@camper/api`

## Coding Conventions

- **Strict TypeScript** everywhere (`"strict": true`)
- **Prettier**: Double quotes, semicolons, trailing commas, 100 char width, 2-space tabs
- **No default exports** (except Next.js pages which require them)
- **Error handling**: Services throw errors, tRPC routers catch and map to TRPCError
- **Imports**: Use `.js` extension for local imports (ESM requirement)

## Testing Patterns

- **Vitest** with globals enabled, co-located test files (`*.test.ts` next to source)
- **API tests**: Use `vi.hoisted()` + `vi.mock()` for database, Redis, and external service mocks
- **Schema tests**: Pure Zod validation, no mocking needed
- **Mock factories**: `apps/api/src/test/mocks/` has db, redis, and fetch helpers
- **Test fixtures**: `apps/api/src/test/fixtures.ts` has IDs and factory functions (`makeCampsite()`, `makeBooking()`, `makeAlert()`)
- **Setup file**: `apps/api/src/test/setup.ts` mocks the `env.js` module with test defaults

## Key File Paths

- DB schema: `apps/api/src/db/schema/index.ts`
- tRPC routers: `apps/api/src/router/`
- Service modules: `apps/api/src/services/{booking,campsite,monitoring,notification,ai}/`
- Platform adapters: `apps/api/src/integrations/{recreation-gov,hipcamp,parks-canada}/`
- AI tools + prompts: `apps/api/src/services/ai/{tools,prompts}.ts`
- Zod schemas: `packages/shared-types/src/schemas/`
- Brand theme: `packages/ui/src/theme.ts`

## External Dependencies

- **Database**: Neon PostgreSQL (serverless) — `DATABASE_URL`
- **Cache**: Redis — `REDIS_URL`
- **AI**: Anthropic Claude API — `ANTHROPIC_API_KEY` (optional for dev)
- **Email**: Resend — `RESEND_API_KEY` (optional for dev)
- **Push**: Expo Push API (no key needed)
- **Auth**: Better Auth — `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- **Payments**: Stripe — `STRIPE_SECRET_KEY` (optional for dev)

## Environment Variables

Required:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `BETTER_AUTH_SECRET` — Auth secret key
- `BETTER_AUTH_URL` — Auth server URL

Optional (features degrade gracefully):
- `ANTHROPIC_API_KEY` — AI chat
- `STRIPE_SECRET_KEY` — Payments
- `RESEND_API_KEY` — Email notifications
- `RECREATION_GOV_API_KEY` — Recreation.gov API access

## Known Gotchas

- **ioredis + BullMQ**: BullMQ pins ioredis 5.9.2; cast Redis instances as `unknown as ConnectionOptions` when passing to BullMQ
- **Tailwind CSS v4**: Web app uses `@import "tailwindcss"` and `@theme` block syntax, not v3 `@tailwind` directives
- **Expo builds**: Uses `eas build`, not local `dist/` output; Turbo build warning is expected
