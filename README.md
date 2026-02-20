# Camper

AI-powered camping assistant that helps you find, monitor, and book campsites across multiple platforms.

## Overview

Camper is a full-stack application that aggregates campsite availability from Recreation.gov, Parks Canada, Hipcamp, and other platforms. It uses AI chat (Claude) to help users search for campsites, set up availability alerts, and manage bookings — all from a single interface.

## Tech Stack

- **API**: Fastify + tRPC v11, TypeScript, Node.js
- **Web**: Next.js 15, React, Tailwind CSS v4
- **Mobile**: Expo (React Native)
- **AI**: Claude API (Anthropic SDK) with tool use
- **Database**: PostgreSQL (Neon serverless) via Drizzle ORM
- **Cache/Queue**: Redis (ioredis) + BullMQ
- **Auth**: Better Auth
- **Payments**: Stripe
- **Email**: Resend
- **Infra**: Docker Compose (local dev), Turborepo + pnpm monorepo

## Project Structure

```
camper/
├── apps/
│   ├── api/          # Fastify + tRPC API server, background workers
│   ├── web/          # Next.js 15 web application
│   └── mobile/       # Expo React Native mobile app
├── packages/
│   ├── shared-types/ # Zod schemas and TypeScript types
│   ├── api-client/   # tRPC client utilities
│   └── ui/           # Shared UI components and theme
├── docker-compose.yml
├── turbo.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- Docker and Docker Compose

### Setup

```bash
# Clone the repository
git clone <repo-url> camper
cd camper

# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL + Redis)
docker compose up -d

# Copy environment variables
cp apps/api/.env.example apps/api/.env
# Edit .env with your database URL, Redis URL, and API keys

# Run database migrations
pnpm db:migrate

# Start all dev servers
pnpm dev
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all dev servers (API, Web, Mobile) |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint all packages |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:push` | Push schema to database |
| `pnpm clean` | Clean all build artifacts |

### Filtered Commands

```bash
pnpm --filter @camper/api dev        # API server only
pnpm --filter @camper/web dev        # Web app only
pnpm --filter @camper/api test       # API tests only
pnpm --filter @camper/shared-types test  # Schema tests only
```

## Dev Servers

| App | URL | Port |
|-----|-----|------|
| API | http://localhost:4000 | 4000 |
| Web | http://localhost:3000 | 3000 |
| Mobile | Expo Go | 8081 |

## Architecture

The API follows a services layer pattern: tRPC routers delegate to service modules (`services/booking`, `services/campsite`, `services/monitoring`, `services/notification`, `services/ai`), which contain all business logic. Platform-specific API integrations live in `integrations/` as adapter classes implementing `BasePlatformAdapter`.

Shared Zod schemas in `@camper/shared-types` define the data model and are used for both runtime validation and TypeScript type inference. Background jobs (availability scanning, alert expiration) run via BullMQ workers.

## Testing

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm --filter @camper/api test
pnpm --filter @camper/shared-types test
```

Tests are co-located with source files (`*.test.ts`). API tests use mock factories for the database, Redis, and fetch. Schema tests validate Zod schemas directly with no mocking required.

## License

Private
