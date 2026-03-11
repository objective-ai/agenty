import { mockSupabaseClient, mockSupabaseAdmin } from "../helpers/supabase-mock";

// Note: mockSupabaseAdmin().from()._fromChain does not have rpc().
// When implementing, add: vi.mock("@/lib/supabase/admin", ...) with rpc mock.
describe("DASH-05: Start Quest Button", () => {
  it.todo("calls spendEnergy(10, 'training_quest') on button click");
  it.todo("updates energy in EconomyContext on success");
  it.todo("shows insufficient energy message when spendEnergy fails");
});
