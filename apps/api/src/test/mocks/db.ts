export function createMockDb() {
  const returningFn = vi.fn().mockResolvedValue([{}]);
  const whereFn = vi.fn().mockReturnValue({ returning: returningFn });
  const setFn = vi.fn().mockReturnValue({ where: whereFn, returning: returningFn });
  const valuesFn = vi.fn().mockReturnValue({ returning: returningFn });

  const db = {
    query: {
      campsites: {
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
      campgrounds: {
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
      bookings: {
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
      alerts: {
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
      notifications: {
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
      notificationPreferences: {
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
      pushTokens: {
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
      users: {
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
      conversations: {
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
      messages: {
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
      userPreferences: {
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
    insert: vi.fn().mockReturnValue({ values: valuesFn }),
    update: vi.fn().mockReturnValue({ set: setFn }),
    // Expose inner mocks for per-test configuration
    _returning: returningFn,
    _where: whereFn,
    _set: setFn,
    _values: valuesFn,
  };

  return db;
}
