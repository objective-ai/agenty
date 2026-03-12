import { createClient } from "@supabase/supabase-js";

// Service-role client for server-side writes.
// Bypasses RLS — only use inside Server Actions.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
