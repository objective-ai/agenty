import { mockSupabaseClient, mockSupabaseAdmin } from "../helpers/supabase-mock";

describe("AUTH-03: Setup Child Account", () => {
  it.todo("creates kid auth user with synthetic email and PIN");
  it.todo("upserts profile row for kid");
  it.todo("rejects unauthenticated caller");
  it.todo("validates PIN is exactly 6 digits");
});
