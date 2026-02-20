import Fastify from "fastify";
import cors from "@fastify/cors";
import {
  fastifyTRPCPlugin,
  type FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import { env } from "./env.js";
import { appRouter, type AppRouter } from "./router/index.js";
import { createContext } from "./trpc.js";
import { auth } from "./auth.js";
import { toNodeHandler } from "better-auth/node";

const server = Fastify({
  logger: {
    level: "info",
  },
  maxParamLength: 5000,
});

async function start() {
  // ─── CORS ───────────────────────────────────────────────────────────
  await server.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  // ─── Better Auth ────────────────────────────────────────────────────
  const authHandler = toNodeHandler(auth);

  server.all("/api/auth/*", async (req, reply) => {
    // Convert Fastify req/reply to Node handler
    await authHandler(req.raw, reply.raw);
    // Mark reply as sent so Fastify doesn't try to send another response
    reply.hijack();
  });

  // ─── tRPC ───────────────────────────────────────────────────────────
  await server.register(fastifyTRPCPlugin, {
    prefix: "/trpc",
    trpcOptions: {
      router: appRouter,
      createContext,
      onError({ error, path }) {
        console.error(`[tRPC] Error on ${path}:`, error.message);
      },
    } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
  });

  // ─── Health Check ───────────────────────────────────────────────────
  server.get("/health", async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // ─── Start ──────────────────────────────────────────────────────────
  try {
    const address = await server.listen({
      port: env.PORT,
      host: "0.0.0.0",
    });
    console.log(`Camper API server listening at ${address}`);
    console.log(`  tRPC:    ${address}/trpc`);
    console.log(`  Auth:    ${address}/api/auth`);
    console.log(`  Health:  ${address}/health`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
