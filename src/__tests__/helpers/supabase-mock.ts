import { vi } from "vitest";

/**
 * Creates a mock Supabase client with common auth and data methods.
 * All methods are vi.fn() so tests can set return values with .mockResolvedValue().
 */
export function mockSupabaseClient() {
  const fromChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return {
    auth: {
      signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithPassword: vi
        .fn()
        .mockResolvedValue({ data: {}, error: null }),
      verifyOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn(() => fromChain),
    _fromChain: fromChain,
  };
}

/**
 * Creates a mock Supabase admin client with admin-level auth and data methods.
 */
export function mockSupabaseAdmin() {
  const fromChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return {
    auth: {
      admin: {
        createUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
        getUserByEmail: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    },
    from: vi.fn(() => fromChain),
    _fromChain: fromChain,
  };
}
