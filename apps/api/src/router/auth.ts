import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { auth } from "../auth.js";
import { fromNodeHeaders } from "better-auth/node";

export const authRouter = router({
  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const result = await auth.api.signUpEmail({
        body: {
          email: input.email,
          password: input.password,
          name: input.name,
        },
      });
      return result;
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await auth.api.signInEmail({
        body: {
          email: input.email,
          password: input.password,
        },
      });
      return result;
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    await auth.api.signOut({
      headers: fromNodeHeaders(ctx.req.headers),
    });
    return { success: true };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return {
      user: ctx.user,
      session: ctx.session,
    };
  }),

  session: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user || !ctx.session) {
      return null;
    }
    return {
      user: ctx.user,
      session: ctx.session,
    };
  }),
});
