import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { FastifyRequest, FastifyReply } from "fastify";
import { db, type Database } from "./db/index.js";
import { auth, type Session } from "./auth.js";
import { fromNodeHeaders } from "better-auth/node";

export interface Context {
  db: Database;
  user: Session["user"] | null;
  session: Session["session"] | null;
  req: FastifyRequest;
  res: FastifyReply;
}

export async function createContext(opts: {
  req: FastifyRequest;
  res: FastifyReply;
}): Promise<Context> {
  let user: Session["user"] | null = null;
  let session: Session["session"] | null = null;

  try {
    const result = await auth.api.getSession({
      headers: fromNodeHeaders(opts.req.headers),
    });
    if (result) {
      user = result.user;
      session = result.session;
    }
  } catch {
    // No valid session -- user remains null
  }

  return {
    db,
    user,
    session,
    req: opts.req,
    res: opts.res,
  };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

const enforceAuth = middleware(async ({ ctx, next }) => {
  if (!ctx.user || !ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      session: ctx.session,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceAuth);
