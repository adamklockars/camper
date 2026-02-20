// Placeholder type — apps should override this by re-exporting from @camper/api.
// At runtime, the actual AppRouter type from the API package provides full type safety.
// This placeholder uses `any` to avoid type constraint errors in the client package.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppRouter = any;
