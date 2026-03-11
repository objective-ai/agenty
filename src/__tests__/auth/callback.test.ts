import { mockSupabaseClient } from "../helpers/supabase-mock";

describe("AUTH-02: PKCE Callback", () => {
  it.todo("verifies OTP and redirects to /setup on success");
  it.todo("redirects to /auth/error on invalid token");
  it.todo("redirects to /auth/error when token_hash missing");
});
