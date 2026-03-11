import { mockSupabaseClient } from "../helpers/supabase-mock";

describe("AUTH-06: Middleware Redirect", () => {
  it.todo("redirects /bridge to / when no session");
  it.todo("redirects / to /bridge when session exists");
  it.todo("allows /setup through regardless of auth state");
});
