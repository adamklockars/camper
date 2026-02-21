import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc.js";
import { savePlatformCredentialInputSchema } from "@camper/shared-types";
import {
  saveCredential,
  listCredentials,
  deleteCredential,
  getCredentialById,
  getDecryptedCredential,
  markCredentialValidated,
} from "../services/credential/index.js";
import { validateLogin, PLATFORM_DOMAINS } from "../integrations/camply/client.js";

export const credentialRouter = router({
  save: protectedProcedure
    .input(savePlatformCredentialInputSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await saveCredential(ctx.user.id, input.platform, {
        username: input.username,
        password: input.password,
      });
      return result;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return listCredentials(ctx.user.id);
  }),

  validate: protectedProcedure
    .input(z.object({ credentialId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const credential = await getCredentialById(input.credentialId, ctx.user.id);
      if (!credential) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Credential not found",
        });
      }

      const decrypted = await getDecryptedCredential(ctx.user.id, credential.platform);
      if (!decrypted) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to decrypt credential",
        });
      }

      const domain = PLATFORM_DOMAINS[credential.platform];
      const result = await validateLogin({
        platform: credential.platform,
        username: decrypted.username,
        password: decrypted.password,
        domain,
      });

      if (result.success) {
        await markCredentialValidated(input.credentialId);
      }

      return { valid: result.success, error: result.error };
    }),

  delete: protectedProcedure
    .input(z.object({ platform: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await deleteCredential(
        ctx.user.id,
        input.platform as Parameters<typeof deleteCredential>[1],
      );
      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Credential not found",
        });
      }
      return { success: true };
    }),
});
