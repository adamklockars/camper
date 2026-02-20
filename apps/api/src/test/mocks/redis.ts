export function createMockRedis() {
  const store = new Map<string, { value: string; expiresAt?: number }>();

  return {
    get: vi.fn(async (key: string) => {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value;
    }),
    set: vi.fn(async (key: string, value: string, mode?: string, ttl?: number) => {
      const entry: { value: string; expiresAt?: number } = { value };
      if (mode === "EX" && ttl) {
        entry.expiresAt = Date.now() + ttl * 1000;
      }
      store.set(key, entry);
      return "OK";
    }),
    del: vi.fn(async (key: string) => {
      store.delete(key);
      return 1;
    }),
    _store: store,
  };
}
