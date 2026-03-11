import { mockSupabaseClient, mockSupabaseAdmin } from "../helpers/supabase-mock";

// Note: mockSupabaseAdmin().from()._fromChain does not have rpc().
// When implementing, add: vi.mock("@/lib/supabase/admin", ...) with rpc mock.
describe("DASH-04: Daily Claim", () => {
  it.todo("calls awardLoot(25, 'daily_bonus') on button click");
  it.todo("updates gold in EconomyContext on success");
  it.todo("does not update gold on awardLoot failure");
});
