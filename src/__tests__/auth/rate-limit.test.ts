import { mockSupabaseClient } from "../helpers/supabase-mock";

describe("AUTH-05: Rate Limiting", () => {
  it.todo("allows login when under attempt limit");
  it.todo("returns tactical_lockdown after 5 failed attempts");
  it.todo("includes unlockAt and remainingSeconds in lockout response");
});
